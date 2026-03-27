package com.scd.aqua.kiosk;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
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
    private static final String[] NATIVE_SERIAL_PATHS = {
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
    private SerialPort nativeSerial;
    private InputStream  nativeInputStream;
    private OutputStream nativeOutputStream;
    private Thread nativeReaderThread;
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

    // ลองเปิดพอร์ตตามลำดับในรายการ
    private void openNativeSerialAuto() {
        for (String path : NATIVE_SERIAL_PATHS) {
            jsLog("NATIVE: trying " + path + " ...");
            try {
                nativeSerial = SerialPort.newBuilder(path, 9600).build();
                nativeInputStream  = nativeSerial.getInputStream();
                nativeOutputStream = nativeSerial.getOutputStream();

                // cache fd สำหรับ RTS toggle (RS485 direction control)
                try {
                    nativeFd = ((java.io.FileInputStream) nativeInputStream).getFD();
                    jsLog("NATIVE: ✅ OPENED → " + path + " @ 9600 baud (RS485 RTS-mode)");
                } catch (Exception ignored) {
                    jsLog("NATIVE: ✅ OPENED → " + path + " @ 9600 baud (no RTS fd)");
                }

                jsStatus("connected");
                startNativeReader();
                return;
            } catch (Exception e) {
                jsLog("NATIVE: ❌ " + path + " → " + e.getMessage());
            }
        }
        jsLog("NATIVE: ❌ ไม่พบพอร์ต Serial ที่ใช้งานได้เลย");
        jsStatus("error");
    }

    // TIOCMBIS / TIOCMBIC — ใช้ toggle RTS สำหรับ RS485 DE/RE control
    // TIOCMBIS = 0x5416 (set modem bits), TIOCMBIC = 0x5417 (clear modem bits)
    // TIOCM_RTS = 0x004
    private static final int TIOCMBIS = 0x5416;
    private static final int TIOCMBIC = 0x5417;
    private static final int TIOCM_RTS = 0x004;
    private java.io.FileDescriptor nativeFd = null;

    private void setNativeRTS(boolean on) {
        if (nativeFd == null) return;
        try {
            android.system.Int32Ref arg = new android.system.Int32Ref(TIOCM_RTS);
            // TIOCMBIS/TIOCMBIC requires a pointer to int in POSIX
            android.system.Os.ioctlInt(nativeFd, on ? TIOCMBIS : TIOCMBIC, arg);
        } catch (Exception ignored) {}
    }
    private void startNativeReader() {
        nativeRunning = true;
        nativeReaderThread = new Thread(() -> {
            byte[] buf = new byte[256];
            while (nativeRunning) {
                try {
                    int len = nativeInputStream.read(buf);
                    if (len > 0) {
                        byte[] received = new byte[len];
                        System.arraycopy(buf, 0, received, 0, len);
                        forwardToJs(received);
                    }
                } catch (IOException e) {
                    if (nativeRunning) {
                        jsLog("NATIVE READ ERROR: " + e.getMessage());
                        jsStatus("error");
                        nativeRunning = false;
                    }
                }
            }
        });
        nativeReaderThread.setName("NativeSerialReader");
        nativeReaderThread.setDaemon(true);
        nativeReaderThread.start();
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
            } else if (nativeOutputStream != null) {
                try {
                    // RS485 Direction Control: Assert RTS → DE=HIGH → MAX485 enters TX mode
                    setNativeRTS(true);
                    Thread.sleep(2); // settle time before first bit

                    nativeOutputStream.write(data);
                    nativeOutputStream.flush();

                    // รอให้ไบต์สุดท้ายออกจาก FIFO ก่อนปิด DE
                    // 9600 baud = ~1ms/byte, เพิ่ม 5ms safety margin
                    long drainMs = (long)(data.length * 1.05) + 5;
                    Thread.sleep(drainMs);

                    // Deassert RTS → DE=LOW → MAX485 enters RX mode
                    setNativeRTS(false);
                } catch (Exception e) { jsLog("TX NATIVE ERROR: " + e.getMessage()); }
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
        nativeRunning = false;
        try { if (nativeInputStream  != null) nativeInputStream.close();  } catch (IOException ignored) {}
        try { if (nativeOutputStream != null) nativeOutputStream.close(); } catch (IOException ignored) {}
        try { if (nativeSerial != null) nativeSerial.close(); } catch (Exception ignored) {}
        super.onDestroy();
    }
}
