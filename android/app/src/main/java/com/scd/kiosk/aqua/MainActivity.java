package com.scd.kiosk.aqua;

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
import android.util.Log;
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

    private static final String ACTION_USB_PERMISSION = "com.scd.kiosk.aqua.USB_PERMISSION";

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
        "/dev/ttyS1",
        "/dev/ttyS2",
        "/dev/ttyS8",
        "/dev/ttyUSB0",
        "/dev/ttyUSB1",
        "/dev/ttyHSL0",
        "/dev/ttyHSL1"
    };

    // ทดลองเปิดทุกพอร์ตที่เป็นไปได้พร้อมกันเพื่อหาพอร์ตที่ถูกต้องของบอร์ดนี้
    private void openNativeSerialAuto() {
        activeNativePorts.clear();
        for (String path : STRICT_SERIAL_PATHS) {
            jsLog("NATIVE: trying " + path + " ...");
            try {
                SerialPort port = SerialPort.newBuilder(path, 115200).build();
                activeNativePorts.add(port);
                jsLog("NATIVE: ✅ CONNECTED → " + path);
                startNativeReader(port, path);
                jsStatus("connected");
                return; // 🎯 LOCK onto the first successful port! No broadcasting.
            } catch (Exception e) {
                // Log and continue to next path
            }
        }
        jsLog("NATIVE: ❌ No available serial ports found.");
        jsStatus("error");
    }
    private void startNativeReader(final SerialPort port, final String path) {
        nativeRunning = true;
                        jsLog("❌ READ ERROR (" + path + "): " + e.getMessage());
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
            usbSerialPort.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            
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
            // 🔍 DEBUG: Build hex string for logging
            StringBuilder hexSb = new StringBuilder();
            for (byte b : data) hexSb.append(String.format("%02X", b));
            String hexStr = hexSb.toString();

                    if (usbSerialPort != null) {
                try {
                    usbSerialPort.write(data, 2000);
                    jsLog("✅ TX USB OK: " + hexStr);
                    Log.i("KioskMainActivity", "🔵 [SERIAL_TX_USB]: " + hexStr);
                } catch (IOException e) {
                    jsLog("❌ TX USB ERROR: " + e.getMessage());
                    Log.e("KioskMainActivity", "🔴 [SERIAL_TX_USB_ERR]: " + e.getMessage());
                }
            } else if (!activeNativePorts.isEmpty()) {
                for (SerialPort port : activeNativePorts) {
                    try {
                        OutputStream os = port.getOutputStream();
                        os.write(data);
                        os.flush();
                        jsLog("✅ TX NATIVE OK: " + hexStr + " (" + data.length + " bytes)");
                        Log.i("KioskMainActivity", "🔵 [SERIAL_TX_NATIVE]: " + hexStr);
                    } catch (Exception e) {
                        jsLog("❌ TX NATIVE ERROR: " + e.getMessage() + " | HEX: " + hexStr);
                        Log.e("KioskMainActivity", "🔴 [SERIAL_TX_NATIVE_ERR]: " + e.getMessage());
                    }
                }
            } else {
                jsLog("❌ TX ERROR: ไม่มีพอร์ตเปิดอยู่ | HEX: " + hexStr);
                Log.w("KioskMainActivity", "⚠️ [SERIAL_TX_FAIL]: No ports open for HEX: " + hexStr);
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
        Log.i("KioskMainActivity", "💡 [JS_LOG]: " + msg); // ALWAYS log to ADB first
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                            "if(window.logToScreen) window.logToScreen('" + msg.replace("'", "\\'") + "')", null);
                }
            } catch (Exception e) {
                Log.e("KioskMainActivity", "❌ JS_LOG_UI_ERR: " + e.getMessage());
            }
        });
    }

    private void jsStatus(String status) {
        Log.i("KioskMainActivity", "📊 [JS_STATUS]: " + status);
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                            "if(window.updateHwStatus) window.updateHwStatus('" + status + "')", null);
                }
            } catch (Exception e) {
                Log.e("KioskMainActivity", "❌ JS_STATUS_UI_ERR: " + e.getMessage());
            }
        });
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

        @JavascriptInterface
        public void jsLog(String msg) {
            MainActivity.this.jsLog(msg);
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
        public void openPort(String path, int baud) {
            nativeRunning = false;
            jsLog("NATIVE: Overriding Port → " + path + " @ " + baud);
            new Thread(() -> {
                try {
                    // ปิดพอร์ตเดิมทั้งหมดก่อน (ถ้ามี)
                    if (!activeNativePorts.isEmpty()) {
                        for (SerialPort p : activeNativePorts) { try { p.close(); } catch(Exception ignored) {} }
                        activeNativePorts.clear();
                    }
                    SerialPort port = SerialPort.newBuilder(path, baud).build();
                    activeNativePorts.add(port);
                    jsLog("NATIVE: ✅ USER OVERRIDE OPENED → " + path);
                    jsStatus("connected");
                    startNativeReader(port, path);
                } catch (Exception e) {
                    jsLog("NATIVE: ❌ OVERRIDE FAIL (" + path + "): " + e.getMessage());
                    jsStatus("error");
                }
            }).start();
        }

        @JavascriptInterface
        public String listPorts() {
            File dev = new File("/dev/");
            File[] files = dev.listFiles();
            StringBuilder sb = new StringBuilder();
            if (files != null) {
                for (File f : files) {
                    if (f.getName().startsWith("ttyS") || f.getName().startsWith("ttyUSB") || f.getName().startsWith("ttyHSL")) {
                        sb.append(f.getAbsolutePath()).append(",");
                    }
                }
            }
            return sb.toString();
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
