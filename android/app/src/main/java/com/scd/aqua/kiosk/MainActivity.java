package com.scd.aqua.kiosk;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.List;

import android.serialport.SerialPort;

public class MainActivity extends BridgeActivity implements SerialInputOutputManager.Listener {

    private static final String ACTION_USB_PERMISSION = "com.scd.aqua.kiosk.USB_PERMISSION";

    // ── USB Serial ──
    private UsbSerialPort usbSerialPort;
    private SerialInputOutputManager ioManager;

    // ── Native Serial (TTL / RS232 / RS485 direct port) ──
    // รายการพอร์ตที่จะลองตามลำดับ (เอา ttyS ขึ้นก่อนเพื่อเลี่ยงการโดน 4G Modem แย่งพอร์ต)
    private static final String[] FALLBACK_SERIAL_PATHS = {
        "/dev/ttyS4",
        "/dev/ttyS3",
        "/dev/ttyS8",
        "/dev/ttyS7",
        "/dev/ttyS9",
        "/dev/ttyS1",
        "/dev/ttyS2",
        "/dev/ttyUSB0",
        "/dev/ttyUSB1",
        "/dev/ttyUSB2",
        "/dev/ttyUSB3",
        "/dev/ftdi4",
        "/dev/ttl4",
        "/dev/ttyHS1",
        "/dev/ttyHS2",
        "/dev/ttyHSL1",
        "/dev/ttyHSL0",
        "/dev/ttyUSB4" // ย้ายมาไว้ท้ายสุดเพราะมักจะเป็นพอร์ตของเน็ตมือถือ 4G 
    };
    // Variables for Native Serial
    private java.util.List<SerialPort> activeNativePorts = new java.util.ArrayList<>();
    private java.util.List<Thread> nativeReaderThreads = new java.util.ArrayList<>();
    private volatile boolean nativeRunning = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getBridge().getWebView().addJavascriptInterface(new SerialBridge(), "AndroidSerial");
        initSerial();
    }

    private void initSerial() {
        // ── บังคับใช้การค้นหา Native Serial (เช่น /dev/ttyUSB0, /dev/ttl4) ──
        // ตัดปัญหา USB Manager ชนกับ Kernel Driver ของ Tablet อุตสาหกรรม
        jsLog("SERIAL: Starting native serial scan...");
        new Thread(this::openNativeSerialAuto).start();
    }

    private static final String[] STRICT_SERIAL_PATHS = {
        "/dev/ttyS4",
        "/dev/ttyS7",
        "/dev/ttyS3",
        "/dev/ttyS8"
    };

    // ทดลองเปิดทุกพอร์ตที่เป็นไปได้พร้อมกันเพื่อหาพอร์ตที่ถูกต้องของบอร์ดนี้
    private void openNativeSerialAuto() {
        activeNativePorts.clear();
        for (String path : STRICT_SERIAL_PATHS) {
            jsLog("NATIVE: strictly trying " + path + " ...");
            try {
                SerialPort port = SerialPort.newBuilder(path, 9600).build();
                activeNativePorts.add(port);
                jsLog("NATIVE: ✅ STRICT OPENED → " + path + " @ 9600 baud");
                startNativeReader(port, path);
            } catch (Exception e) {
                jsLog("NATIVE: ❌ " + path + " → " + e.getMessage());
            }
        }
        if (!activeNativePorts.isEmpty()) {
            jsStatus("connected");
            jsLog("NATIVE: Broadcasting to " + activeNativePorts.size() + " ports to test hardware.");
        } else {
            jsLog("NATIVE: ❌ ไม่พบพอร์ต Serial ที่ใช้งานได้เลย");
            jsStatus("error");
        }
    }
    private void startNativeReader(SerialPort port, String path) {
        nativeRunning = true;
        Thread readerThread = new Thread(() -> {
            byte[] buf = new byte[256];
            InputStream is = port.getInputStream();
            while (nativeRunning) {
                try {
                    int len = is.read(buf);
                    if (len > 0) {
                        byte[] received = new byte[len];
                        System.arraycopy(buf, 0, received, 0, len);
                        jsLog("🎯 RX from " + path + "!");
                        forwardToJs(received);
                    }
                } catch (IOException e) {
                    if (nativeRunning) {
                        jsLog("NATIVE READ ERROR (" + path + "): " + e.getMessage());
                    }
                    break;
                }
            }
        });
        readerThread.setName("NativeReader-" + path);
        readerThread.setDaemon(true);
        readerThread.start();
        nativeReaderThreads.add(readerThread);
    }

    // ─────────────────────────────────────────────
    //  USB Serial
    // ─────────────────────────────────────────────
    private void openUsbPort(UsbSerialDriver driver) {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        UsbDeviceConnection connection = manager.openDevice(driver.getDevice());
        if (connection == null) { jsLog("USB: cannot open device connection"); return; }

        usbSerialPort = driver.getPorts().get(0);
        try {
            usbSerialPort.open(connection);
            usbSerialPort.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            
            // สำหรับชิป FTDI ต้องเปิด DTR / RTS เพื่อปลดล็อก Endpoint ป้องกัน queueing request failed
            usbSerialPort.setDTR(true);
            usbSerialPort.setRTS(true);
            
            jsLog("USB: PORT OPENED OK — waiting 1s for FTDI to stabilize...");

            // รอ 1 วินาทีให้ FTDI chip ผ่านช่วง reset ก่อนเริ่มอ่านข้อมูล
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                ioManager = new SerialInputOutputManager(usbSerialPort, this);
                ioManager.start();
                jsLog("USB: IO Manager started ✅");
                jsStatus("connected");
            }, 1000);

        } catch (IOException e) {
            jsLog("USB ERROR: " + e.getMessage());
            jsStatus("error");
        }
    }

    // USB listener callbacks
    @Override
    public void onNewData(byte[] data) {
        forwardToJs(data);
    }

    @Override
    public void onRunError(Exception e) {
        final String msg = e.getMessage();
        jsLog("USB RUN ERROR: " + msg);
        jsStatus("error");

        // Auto-retry: รอ 2 วิแล้วพยายามเชื่อมใหม่อัตโนมัติ
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            jsLog("USB: Auto-reconnecting...");
            if (ioManager != null) {
                ioManager.stop();
                ioManager = null;
            }
            try {
                if (usbSerialPort != null) {
                    ioManager = new SerialInputOutputManager(usbSerialPort, this);
                    ioManager.start();
                    jsLog("USB: IO Manager restarted ✅");
                    jsStatus("connected");
                }
            } catch (Exception ex) {
                jsLog("USB: Reconnect failed → " + ex.getMessage());
            }
        }, 2000);
    }

    // ─────────────────────────────────────────────

    // ─────────────────────────────────────────────
    //  ส่งข้อมูล Hex ออก (ทั้ง USB และ Native)
    // ─────────────────────────────────────────────
    private void writeBytes(byte[] data) {
        new Thread(() -> {
            if (usbSerialPort != null) {
                try { usbSerialPort.write(data, 2000); } catch (IOException e) { jsLog("TX USB ERROR: " + e.getMessage()); }
            } else if (!activeNativePorts.isEmpty()) {
                // Broadcast ส่งข้อมูลเจาะลึกทุกพอร์ตบนเมนบอร์ดพร้อมกัน เพื่อหาพอร์ตที่ต่อสายไว้
                for (SerialPort port : activeNativePorts) {
                    try {
                        port.getOutputStream().write(data);
                        port.getOutputStream().flush();
                    } catch (Exception e) { /* ignore individual port errors during broadcast */ }
                }
            } else {
                jsLog("TX ERROR: ไม่มีพอร์ตเปิดอยู่");
            }
        }).start();
    }

    // ─────────────────────────────────────────────
    //  Helpers: ส่งข้อมูลกลับไปที่ JS
    // ─────────────────────────────────────────────
    private void forwardToJs(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data) sb.append(String.format("%02X", b));
        final String hex = sb.toString();
        runOnUiThread(() -> {
            getBridge().getWebView().evaluateJavascript(
                    "if(window.onSerialReceiveHex) window.onSerialReceiveHex('" + hex + "')", null);
        });
    }

    private void jsLog(String msg) {
        runOnUiThread(() ->
            getBridge().getWebView().evaluateJavascript(
                    "if(window.logToScreen) window.logToScreen('" + msg.replace("'", "\\'") + "')", null));
    }

    private void jsStatus(String status) {
        runOnUiThread(() ->
            getBridge().getWebView().evaluateJavascript(
                    "if(window.updateHwStatus) window.updateHwStatus('" + status + "')", null));
    }

    // ─────────────────────────────────────────────
    //  JavaScript Bridge
    // ─────────────────────────────────────────────
    public class SerialBridge {
        @JavascriptInterface
        public String getMacAddress() {
            try {
                java.util.List<java.net.NetworkInterface> interfaces = java.util.Collections.list(java.net.NetworkInterface.getNetworkInterfaces());
                for (java.net.NetworkInterface nif : interfaces) {
                    if (!nif.getName().equalsIgnoreCase("wlan0") && !nif.getName().equalsIgnoreCase("eth0")) continue;

                    byte[] macBytes = nif.getHardwareAddress();
                    if (macBytes == null) return "";

                    StringBuilder res1 = new StringBuilder();
                    for (byte b : macBytes) {
                        res1.append(String.format("%02X:", b));
                    }

                    if (res1.length() > 0) {
                        res1.deleteCharAt(res1.length() - 1);
                    }
                    return res1.toString().toUpperCase();
                }
            } catch (Exception e) {
                return "02:00:00:00:00:00";
            }
            return "02:00:00:00:00:00";
        }

        @JavascriptInterface
        public String getDeviceId() {
            try {
                // 🛠️ 1. ลอง MAC Address ก่อนตามคำขอของผู้ใช้ (Unique & Stable สำหรับบอร์ดตู้)
                String mac = getMacAddress();
                if (mac != null && !mac.equals("") && !mac.equals("02:00:00:00:00:00")) {
                    return mac.replace(":", "").toUpperCase();
                }

                // 🛠️ 2. ลองอ่าน Hardware Serial ตรงๆ จากบอร์ด
                String sn = getSystemProperty("ro.serialno");
                if (sn != null && !sn.equals("") && !sn.equalsIgnoreCase("unknown")) {
                    return sn.toUpperCase();
                }
                
                // 🛠️ 3. ลองอ่าน Build.SERIAL 
                String serial = android.os.Build.SERIAL;
                if (serial != null && !serial.equals("") && !serial.equalsIgnoreCase("unknown")) {
                    return serial.toUpperCase();
                }
                
                // 🛠️ 4. ใช้ ANDROID_ID เป็นทางเลือกสุดท้าย
                String aid = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
                if (aid != null && !aid.equals("")) {
                    return aid.toUpperCase();
                }

                return (android.os.Build.MODEL + "_" + android.os.Build.BOARD).replace(" ", "_").toUpperCase();
            } catch (Exception e) {
                return "DEVICE_" + android.os.Build.ID.toUpperCase();
            }
        }

        private String getSystemProperty(String key) {
            try {
                Class<?> c = Class.forName("android.os.SystemProperties");
                java.lang.reflect.Method get = c.getMethod("get", String.class);
                return (String) get.invoke(c, key);
            } catch (Exception e) {
                return null;
            }
        }

        @JavascriptInterface
        public void sendHex(String hexString) {
            int len = hexString.length();
            byte[] data = new byte[len / 2];
            for (int i = 0; i < len; i += 2) {
                data[i / 2] = (byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                        + Character.digit(hexString.charAt(i + 1), 16));
            }
            writeBytes(data);
        }

        @JavascriptInterface
        public void send(String text) {
            writeBytes((text + "\n").getBytes());
        }

        @JavascriptInterface
        public void initSerial() {
            // ปิด native ก่อน แล้วค่อย reconnect
            nativeRunning = false;
            runOnUiThread(() -> MainActivity.this.initSerial());
        }

        @JavascriptInterface
        public void exitKiosk() {
            runOnUiThread(() -> { try { finish(); } catch (Exception ignored) {} });
        }

        @JavascriptInterface
        public void openSettings() {
            runOnUiThread(() -> {
                try { startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS)); }
                catch (Exception ignored) {}
            });
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_HOME || keyCode == KeyEvent.KEYCODE_APP_SWITCH
                || keyCode == KeyEvent.KEYCODE_MENU) return true;
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        nativeRunning = false;
        if (!activeNativePorts.isEmpty()) {
            for (SerialPort port : activeNativePorts) {
                try { port.getInputStream().close(); } catch (Exception ignored) {}
                try { port.getOutputStream().close(); } catch (Exception ignored) {}
                try { port.close(); } catch (Exception ignored) {}
            }
            activeNativePorts.clear();
        }

        if (ioManager != null) {
            ioManager.stop();
            ioManager = null;
        }
        if (usbSerialPort != null) {
            try { usbSerialPort.close(); } catch (IOException ignored) {}
            usbSerialPort = null;
        }
    }
}
