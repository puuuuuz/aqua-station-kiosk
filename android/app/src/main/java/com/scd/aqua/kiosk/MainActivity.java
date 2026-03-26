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

        // ── Keep screen on ──
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // ── JS Bridge Registration ──
        getBridge().getWebView().addJavascriptInterface(new SerialBridge(), "AndroidSerial");

        // ── Start Serial Auto-Connect ──
        initSerial();
    }

    private void initSerial() {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        List<UsbSerialDriver> availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(manager);
        
        final int count = availableDrivers.size();
        runOnUiThread(() -> {
            getBridge().getWebView().evaluateJavascript("if(window.logToScreen) window.logToScreen('USB Drivers found: " + count + "')", null);
        });

        if (availableDrivers.isEmpty()) {
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
        try {
            Process process = Runtime.getRuntime().exec("chmod 666 " + path);
            process.waitFor();
            
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
            
            // 🚥 แจ้งสถานะหน้าจอว่าเชื่อมต่อแล้ว
            runOnUiThread(() -> {
                getBridge().getWebView().evaluateJavascript("if(window.updateHwStatus) window.updateHwStatus('connected')", null);
            });
            
        } catch (IOException e) {
            final String err = e.getMessage();
            runOnUiThread(() -> {
                getBridge().getWebView().evaluateJavascript("if(window.logToScreen) window.logToScreen('USB ERROR: " + err + "')", null);
            });
            e.printStackTrace();
        }
    }

    // ── Serial Listeners ──
    @Override
    public void onNewData(byte[] data) {
        final String message = new String(data);
        StringBuilder sb = new StringBuilder();
        for (byte b : data) {
            sb.append(String.format("%02X", b));
        }
        final String hexString = sb.toString();

        runOnUiThread(() -> {
            // Forward data to Web Layout (JavaScript)
            getBridge().getWebView().evaluateJavascript("if(window.onSerialReceive) window.onSerialReceive('" + message.trim() + "')", null);
            getBridge().getWebView().evaluateJavascript("if(window.onSerialReceiveHex) window.onSerialReceiveHex('" + hexString + "')", null);
        });
    }

    @Override
    public void onRunError(Exception e) {
        // 🚥 แจ้งสถานะหน้าจอเมื่อเกิดข้อผิดพลาด
        runOnUiThread(() -> {
            getBridge().getWebView().evaluateJavascript("if(window.updateHwStatus) window.updateHwStatus('error')", null);
        });
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

        @JavascriptInterface
        public void sendHex(String hexString) {
            if (usbSerialPort != null) {
                try {
                    int len = hexString.length();
                    byte[] data = new byte[len / 2];
                    for (int i = 0; i < len; i += 2) {
                        data[i / 2] = (byte) ((Character.digit(hexString.charAt(i), 16) << 4)
                             + Character.digit(hexString.charAt(i+1), 16));
                    }
                    usbSerialPort.write(data, 2000);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        @JavascriptInterface
        public void exitKiosk() {
            runOnUiThread(() -> {
                try {
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

        @JavascriptInterface
        public void initSerial() {
            runOnUiThread(() -> {
                MainActivity.this.initSerial();
            });
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_HOME || keyCode == KeyEvent.KEYCODE_APP_SWITCH || keyCode == KeyEvent.KEYCODE_MENU) return true;
        return super.onKeyDown(keyCode, event);
    }
}

