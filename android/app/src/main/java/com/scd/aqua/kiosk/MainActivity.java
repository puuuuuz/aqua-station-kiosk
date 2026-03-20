package com.scd.aqua.kiosk;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.io.IOException;
import java.util.List;

public class MainActivity extends BridgeActivity implements SerialInputOutputManager.Listener {

    private static final String ACTION_USB_PERMISSION = "com.scd.aqua.kiosk.USB_PERMISSION";
    private UsbSerialPort usbSerialPort;
    private SerialInputOutputManager ioManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Kiosk Mode: Keep screen on ──
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // ── Fullscreen Immersive Mode ──
        hideSystemUI();

        // ── Kiosk Mode: Request Lock Task ──
        try {
            startLockTask();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ── JS Bridge Registration ──
        getBridge().getWebView().addJavascriptInterface(new SerialBridge(), "AndroidSerial");

        // ── Start Serial Auto-Connect ──
        initSerial();
    }

    private void initSerial() {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager);
        
        if (availableDrivers.isEmpty()) {
            // 🚥 Fallback: Try for Native Industrial Port (ttyS9)
            initNativeSerial("/dev/ttyS9");
            return;
        }

        UsbSerialDriver driver = availableDrivers.get(0);
        UsbDevice device = driver.getDevice();

        if (!manager.hasPermission(device)) {
            PendingIntent usbPermissionIntent = PendingIntent.getBroadcast(this, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE);
            manager.requestPermission(device, usbPermissionIntent);
        } else {
            openPort(driver);
        }
    }

    private void initNativeSerial(String path) {
        // สำหรับ Industrial Tablet: ลองเข้าถึงพอร์ตตรงๆ
        try {
            // พยายามขอสิทธิ์เข้าถึงพอร์ต (บางเครื่องอาจต้อง Root)
            Process process = Runtime.getRuntime().exec("chmod 666 " + path);
            process.waitFor();
            
            // หมายเหตุ: โค้ดส่วนนี้ต้องการ Library Native SerialPort แยกต่างหาก 
            // แต่เนื่องจากคุณใช้ ttyS9 ผมแนะนำให้ใช้สาย USB-to-Serial เสียบที่ช่อง USB ของแท็บเล็ตแทนจะเสถียรกว่ามากครับ
            // Toast removed for production

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void openPort(UsbSerialDriver driver) {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        UsbDeviceConnection connection = manager.openDevice(driver.getDevice());
        if (connection == null) return;

        usbSerialPort = driver.getPorts().get(0);
        try {
            usbSerialPort.open(connection);
            usbSerialPort.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            
            ioManager = new SerialInputOutputManager(usbSerialPort, this);
            ioManager.start();
            
            // Toast removed for production

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // ── Serial Listeners ──
    @Override
    public void onNewData(byte[] data) {
        final String message = new String(data);
        runOnUiThread(() -> {
            // Forward data to Web Layout (JavaScript)
            getBridge().getWebView().evaluateJavascript("if(window.onSerialReceive) window.onSerialReceive('" + message.trim() + "')", null);
        });
    }

    @Override
    public void onRunError(Exception e) {
        // Log error to console instead of toast
    }

    // ── JavaScript Interface Class ──
    public class SerialBridge {
        @JavascriptInterface
        public void send(String data) {
            if (usbSerialPort != null) {
                try {
                    usbSerialPort.write((data + "\n").getBytes(), 2000);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    // ── UI & Kiosk Logic ──
    private void hideSystemUI() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUI();
    }

    @Override
    public void onBackPressed() {}

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_HOME || keyCode == KeyEvent.KEYCODE_APP_SWITCH || keyCode == KeyEvent.KEYCODE_MENU) return true;
        return super.onKeyDown(keyCode, event);
        @JavascriptInterface
        public void exitKiosk() {
            runOnUiThread(() -> {
                try {
                    stopLockTask();
                    finish();
                } catch (Exception e) {}
            });
        }

        @JavascriptInterface
        public void openSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));
                } catch (Exception e) {}
            });
        }
    }
}

