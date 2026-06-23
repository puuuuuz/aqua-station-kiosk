package com.scd.kiosk.aqua;

import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
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
import android.media.MediaPlayer;
import android.content.res.AssetFileDescriptor;
import android.os.PowerManager;
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
    // รายการพอร์ตที่จะลองตามลำดับ (เอา ttyS ขึ้นก่อนเพื่อเลี่ยงการโดน 4G Modem
    // แย่งพอร์ต)
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

    // ── Fast ANR Watchdog (3.5-second strict check) ──
    private long lastUIThreadResponseTime = System.currentTimeMillis();
    private java.util.Timer fastAnrWatchdogTimer;
    private final android.os.Handler uiThreadPinger = new android.os.Handler(android.os.Looper.getMainLooper());

    // ── Restart Caching (To prevent ANR Binder deadlocks) ──
    private android.app.AlarmManager cachedAlarmManager;
    private android.app.PendingIntent cachedRestartIntent;

    // ── Watchdog for Webview Freeze (Heartbeat check) ──
    private long lastHeartbeatTime = System.currentTimeMillis();
    private java.util.Timer hardwareWatchdogTimer;

    // ── Daily Maintenance Reboot & Cache/RAM Cleaner ──
    private int lastMaintenanceDayOfYear = -1;
    private final android.os.Handler maintenanceHandler = new android.os.Handler();
    private final Runnable maintenanceRunnable = new Runnable() {
        @Override
        public void run() {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            int hour = cal.get(java.util.Calendar.HOUR_OF_DAY);
            int minute = cal.get(java.util.Calendar.MINUTE);
            int dayOfYear = cal.get(java.util.Calendar.DAY_OF_YEAR);

            // Trigger every day at 04:00 AM (local quiet hours)
            if (hour == 4 && minute == 0 && dayOfYear != lastMaintenanceDayOfYear) {
                lastMaintenanceDayOfYear = dayOfYear;
                Log.i("MAINTENANCE", "⏰ Daily Maintenance triggered at 04:00 AM! Clearing cache/RAM and restarting...");
                performMaintenanceAndReboot();
            } else {
                maintenanceHandler.postDelayed(this, 60000); // Check every 60 seconds
            }
        }
    };

    private void performMaintenanceAndReboot() {
        runOnUiThread(() -> {
            try {
                // 1. Clear WebView cache & cookies/storage
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().clearCache(true);
                }

                // 2. Clear App Cache directory to release storage
                deleteCacheDir(getCacheDir());

                // 3. Restart App to fully flush RAM and refresh connection
                restartApp();
            } catch (Exception e) {
                Log.e("MAINTENANCE", "Maintenance error: " + e.getMessage());
                restartApp();
            }
        });
    }

    private void deleteCacheDir(java.io.File dir) {
        try {
            if (dir != null && dir.isDirectory()) {
                String[] children = dir.list();
                if (children != null) {
                    for (String child : children) {
                        deleteCacheDir(new java.io.File(dir, child));
                    }
                }
                dir.delete();
            } else if (dir != null && dir.isFile()) {
                dir.delete();
            }
        } catch (Exception e) {
            Log.e("MAINTENANCE", "Failed to delete file: " + e.getMessage());
        }
    }

    public void restartApp() {
        runOnUiThread(() -> {
            try {
                jsLog("SYSTEM: Restarting App remotely...");

                // ✅ FIX: Acquire WakeLock BEFORE restart so screen turns on after relaunch
                try {
                    PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        PowerManager.WakeLock wl = pm.newWakeLock(
                                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                        | PowerManager.ON_AFTER_RELEASE,
                                "aqua:restart_wakelock");
                        wl.acquire(15000L); // Hold 15s — released automatically by OS after app restarts
                    }
                } catch (Exception we) {
                    Log.w("SYSTEM", "WakeLock acquire failed: " + we.getMessage());
                }

                Intent intent = getBaseContext().getPackageManager()
                        .getLaunchIntentForPackage(getBaseContext().getPackageName());
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                startActivity(intent);
                finish();
                Runtime.getRuntime().exit(0);
            } catch (Exception e) {
                Log.e("SYSTEM", "Failed to restart: " + e.getMessage());
            }
        });
    }

    public void restartAppBackground() {
        try {
            Log.e("SYSTEM", "🚨 FORCE KILLING AND RESTARTING APP FROM BACKGROUND WATCHDOG!");
            if (cachedAlarmManager != null && cachedRestartIntent != null) {
                cachedAlarmManager.set(android.app.AlarmManager.RTC, System.currentTimeMillis() + 100,
                        cachedRestartIntent);
            }
            android.os.Process.killProcess(android.os.Process.myPid());
            System.exit(0);
        } catch (Exception e) {
            Log.e("SYSTEM", "Failed to force restart background: " + e.getMessage());
            android.os.Process.killProcess(android.os.Process.myPid());
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Cache restart intents early to prevent ANR Binder deadlocks later
        try {
            Intent restartIntent = getBaseContext().getPackageManager()
                    .getLaunchIntentForPackage(getBaseContext().getPackageName());
            if (restartIntent != null) {
                restartIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                restartIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                restartIntent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED); // ✅ FIX: Ensure activity resets
                                                                                   // properly after background kill
                cachedRestartIntent = android.app.PendingIntent.getActivity(
                        getBaseContext(),
                        123456,
                        restartIntent,
                        android.app.PendingIntent.FLAG_CANCEL_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                cachedAlarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
            }
        } catch (Exception e) {
            Log.e("SYSTEM", "Failed to cache restart intent: " + e.getMessage());
        }

        // 🚀 FULL KIOSK & IMMERSIVE PREP
        // ✅ FIX: Added FLAG_TURN_SCREEN_ON + FLAG_SHOW_WHEN_LOCKED so screen wakes
        // after restart
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        hideSystemUI();

        getBridge().getWebView().addJavascriptInterface(new SerialBridge(), "AndroidSerial");
        initSerial();

        // 🔒 START LOCK TASK (KIOSK PINNING)
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminName = new ComponentName(this, KioskDeviceAdminReceiver.class);

            if (dpm.isDeviceOwnerApp(getPackageName())) {
                dpm.setLockTaskPackages(adminName, new String[] { getPackageName() });
                jsLog("SYSTEM: Device Owner detected, whitelisted LockTask ✅");
            }

            startLockTask();
            jsLog("SYSTEM: Kiosk Mode (LockTask) Started ✅");
        } catch (Exception e) {
            jsLog("SYSTEM: Kiosk Mode Start Fail - " + e.getMessage());
        }

        // ⚡️ START FAST ANR WATCHDOG (3.5 Seconds Strict Kill)
        fastAnrWatchdogTimer = new java.util.Timer("FastAnrWatchdogTimer", true);
        fastAnrWatchdogTimer.scheduleAtFixedRate(new java.util.TimerTask() {
            private boolean isFirstRun = true;

            @Override
            public void run() {
                if (isFirstRun) {
                    lastUIThreadResponseTime = System.currentTimeMillis();
                    isFirstRun = false;
                }
                long elapsed = System.currentTimeMillis() - lastUIThreadResponseTime;
                if (elapsed > 3500) { // 3.5 seconds without UI thread response (pre-empt Android's 5s ANR)
                    Log.e("WATCHDOG", "🚨 UI THREAD FROZEN FOR " + (elapsed / 1000.0) + "s! PRE-EMPTIVE ANR KILL!");
                    restartAppBackground();
                } else {
                    // Post a ping to UI thread
                    uiThreadPinger.post(() -> lastUIThreadResponseTime = System.currentTimeMillis());
                }
            }
        }, 15000, 1000); // Start after 15s grace, check EVERY 1 SECOND

        // ⏰ START WEBVIEW HEARTBEAT WATCHDOG (Background Thread)
        lastHeartbeatTime = System.currentTimeMillis();
        hardwareWatchdogTimer = new java.util.Timer("HardwareWatchdogTimer", true);
        hardwareWatchdogTimer.scheduleAtFixedRate(new java.util.TimerTask() {
            @Override
            public void run() {
                long elapsed = System.currentTimeMillis() - lastHeartbeatTime;
                if (elapsed > 90000) { // 90 seconds without heartbeat
                    Log.e("WATCHDOG", "Heartbeat lost for " + (elapsed / 1000)
                            + "s! WebView frozen. Auto-restarting from background thread!");
                    restartAppBackground();
                }
            }
        }, 45000, 15000); // Start after 45s, check every 15s

        // ⏰ START DAILY MAINTENANCE TIMER (Checks every minute for 04:00 AM)
        maintenanceHandler.postDelayed(maintenanceRunnable, 60000);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (android.hardware.usb.UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(intent.getAction())) {
            jsLog("USB: Device attached intent received! Re-initializing...");
            initSerial();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    private void hideSystemUI() {
        runOnUiThread(() -> {
            int flags = android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                    | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        });
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
        Thread readerThread = new Thread(new Runnable() {
            @Override
            public void run() {
                try (InputStream is = port.getInputStream()) {
                    byte[] buf = new byte[1024];
                    while (nativeRunning && !Thread.currentThread().isInterrupted()) {
                        int len = is.read(buf);
                        if (len > 0) {
                            final byte[] received = new byte[len];
                            System.arraycopy(buf, 0, received, 0, len);
                            runOnUiThread(() -> {
                                String rxHex = bytesToHex(received);
                                Log.i("KioskMainActivity", "📥 [SERIAL_RX] (" + path + "): " + rxHex);
                                jsLog("📥 RX (" + path + ") " + received.length + "bytes: " + rxHex);
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if(window.onSerialReceiveHex) window.onSerialReceiveHex('" + rxHex + "');",
                                            null);
                                }
                            });
                        }
                    }
                } catch (Exception e) {
                    Log.e("KioskMainActivity", "❌ READ ERROR (" + path + "): " + e.getMessage());
                }
                Log.i("KioskMainActivity", "Reader thread stopped for " + path);
            }
        });
        readerThread.setName("SerialReader-" + path);
        readerThread.start();
        nativeReaderThreads.add(readerThread);
    }

    // ─────────────────────────────────────────────
    // USB Serial
    // ─────────────────────────────────────────────
    private void openUsbPort(UsbSerialDriver driver) {
        UsbManager manager = (UsbManager) getSystemService(Context.USB_SERVICE);
        UsbDeviceConnection connection = manager.openDevice(driver.getDevice());
        if (connection == null) {
            jsLog("USB: cannot open device connection");
            return;
        }

        usbSerialPort = driver.getPorts().get(0);
        try {
            usbSerialPort.open(connection);
            usbSerialPort.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

            // สำหรับชิป FTDI ต้องเปิด DTR / RTS เพื่อปลดล็อก Endpoint ป้องกัน queueing
            // request failed
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
    // ส่งข้อมูล Hex ออก (ทั้ง USB และ Native)
    // ─────────────────────────────────────────────
    private void writeBytes(byte[] data) {
        new Thread(() -> {
            // 🔍 DEBUG: Build hex string for logging
            StringBuilder hexSb = new StringBuilder();
            for (byte b : data)
                hexSb.append(String.format("%02X", b));
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
    // Helpers: ส่งข้อมูลกลับไปที่ JS
    // ─────────────────────────────────────────────
    private void forwardToJs(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data)
            sb.append(String.format("%02X", b));
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

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes)
            sb.append(String.format("%02X", b));
        return sb.toString();
    }

    // ─────────────────────────────────────────────
    // JavaScript Bridge
    // ─────────────────────────────────────────────
    public class SerialBridge {
        private MediaPlayer mediaPlayer;

        @JavascriptInterface
        public void playVoice(String jsonStr) {
            runOnUiThread(() -> {
                try {
                    String filename = jsonStr;
                    if (jsonStr.startsWith("{")) {
                        org.json.JSONObject json = new org.json.JSONObject(jsonStr);
                        filename = json.optString("file", json.optString("filename", ""));
                    }
                    if (filename == null || filename.isEmpty())
                        return;

                    if (mediaPlayer != null) {
                        try {
                            mediaPlayer.stop();
                            mediaPlayer.release();
                        } catch (Exception ignored) {
                        }
                        mediaPlayer = null;
                    }

                    mediaPlayer = new MediaPlayer();
                    AssetFileDescriptor afd = getAssets().openFd("public/audio/" + filename);
                    mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                    afd.close();
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                } catch (Exception e) {
                    Log.e("KioskMainActivity", "Native Voice Error: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public String getMacAddress() {
            try {
                java.util.List<java.net.NetworkInterface> interfaces = java.util.Collections
                        .list(java.net.NetworkInterface.getNetworkInterfaces());
                for (java.net.NetworkInterface nif : interfaces) {
                    if (!nif.getName().equalsIgnoreCase("wlan0") && !nif.getName().equalsIgnoreCase("eth0"))
                        continue;

                    byte[] macBytes = nif.getHardwareAddress();
                    if (macBytes == null)
                        return "";

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
                        for (SerialPort p : activeNativePorts) {
                            try {
                                p.close();
                            } catch (Exception ignored) {
                            }
                        }
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
                    if (f.getName().startsWith("ttyS") || f.getName().startsWith("ttyUSB")
                            || f.getName().startsWith("ttyHSL")) {
                        sb.append(f.getAbsolutePath()).append(",");
                    }
                }
            }
            return sb.toString();
        }

        @JavascriptInterface
        public String getAppVersion() {
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pInfo.versionName;
            } catch (Exception e) {
                return "1.0.0";
            }
        }

        @JavascriptInterface
        public String getAndroidVersion() {
            return android.os.Build.VERSION.RELEASE;
        }

        @JavascriptInterface
        public void stopKiosk() {
            runOnUiThread(() -> {
                try {
                    stopLockTask();
                    jsLog("SYSTEM: Kiosk Mode Stopped 🔓");
                } catch (Exception e) {
                    jsLog("SYSTEM: Kiosk Mode Stop Fail - " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void clearDeviceOwner() {
            runOnUiThread(() -> {
                try {
                    DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
                    if (dpm.isDeviceOwnerApp(getPackageName())) {
                        stopLockTask();
                        dpm.clearDeviceOwnerApp(getPackageName());
                        jsLog("SYSTEM: Device Owner Cleared Successfully 🔓 (You can now uninstall the app)");
                    } else {
                        jsLog("SYSTEM: App is not Device Owner.");
                    }
                } catch (Exception e) {
                    jsLog("SYSTEM: Clear Device Owner Fail - " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void startKiosk() {
            runOnUiThread(() -> {
                try {
                    DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
                    ComponentName adminName = new ComponentName(MainActivity.this, KioskDeviceAdminReceiver.class);

                    if (dpm.isDeviceOwnerApp(getPackageName())) {
                        dpm.setLockTaskPackages(adminName, new String[] { getPackageName() });
                        jsLog("SYSTEM: Device Owner detected, whitelisted LockTask ✅");
                    }

                    startLockTask();
                    jsLog("SYSTEM: Kiosk Mode Started ✅");
                } catch (Exception e) {
                    jsLog("SYSTEM: Kiosk Mode Start Fail - " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void exitKiosk() {
            runOnUiThread(() -> {
                try {
                    finish();
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void restartApp() {
            MainActivity.this.restartApp();
        }

        @JavascriptInterface
        public void sendHeartbeat() {
            lastHeartbeatTime = System.currentTimeMillis();
        }

        @JavascriptInterface
        public void simulateJavaFreeze() {
            runOnUiThread(() -> {
                Log.e("WATCHDOG", "SIMULATING A HARD FREEZE ON UI THREAD. GOODBYE.");
                while (true) {
                    try {
                        Thread.sleep(1000);
                    } catch (Exception e) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void downloadAndInstallUpdate(String url) {
            jsLog("OTA: Start downloading APK from " + url);
            runOnUiThread(() -> {
                try {
                    File targetDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                    File targetFile = new File(targetDir, "update.apk");
                    if (targetFile.exists()) {
                        targetFile.delete();
                    }

                    android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(
                            android.net.Uri.parse(url));
                    request.setTitle("Kiosk Update");
                    request.setDescription("Downloading newer version...");
                    request.setNotificationVisibility(
                            android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, "update.apk");

                    android.app.DownloadManager manager = (android.app.DownloadManager) getSystemService(
                            Context.DOWNLOAD_SERVICE);
                    final long downloadId = manager.enqueue(request);

                    // Register receiver to install when download finish
                    registerReceiver(new android.content.BroadcastReceiver() {
                        @Override
                        public void onReceive(Context context, Intent intent) {
                            long id = intent.getLongExtra(android.app.DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                            if (downloadId == id) {
                                jsLog("OTA: Download Complete. Triggering Install...");
                                installApk();
                            }
                        }
                    }, new android.content.IntentFilter(android.app.DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                            Context.RECEIVER_EXPORTED);

                } catch (Exception e) {
                    jsLog("OTA ERROR: " + e.getMessage());
                }
            });
        }

        private void installApk() {
            File apkFile = new File(android.os.Environment.getExternalStoragePublicDirectory(
                    android.os.Environment.DIRECTORY_DOWNLOADS), "update.apk");
            
            if (!apkFile.exists()) {
                jsLog("INSTALL ERROR: APK file not found at " + apkFile.getAbsolutePath());
                return;
            }

            if (!validateApk(apkFile)) {
                jsLog("OTA ABORTED: Package validation failed.");
                return;
            }

            jsLog("OTA: Validation passed. Attempting Root Install...");
            
            // 1. Try Root (su)
            if (installApkRoot(apkFile)) {
                return;
            }
            
            jsLog("OTA: Root install failed. Attempting Device Owner Install...");
            
            // 2. Try Device Owner (PackageInstaller)
            try {
                DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
                if (dpm.isDeviceOwnerApp(getPackageName())) {
                    installApkDeviceOwner(apkFile);
                    return;
                } else {
                    jsLog("OTA: App is NOT Device Owner.");
                }
            } catch (Exception e) {
                jsLog("OTA DeviceOwner Check Error: " + e.getMessage());
            }
            
            // 3. Fallback to normal intent (Prompt user)
            jsLog("OTA: Falling back to standard prompt install...");
            installApkFallback(apkFile);
        }

        private boolean validateApk(File apkFile) {
            try {
                android.content.pm.PackageManager pm = getPackageManager();
                android.content.pm.PackageInfo newInfo = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), android.content.pm.PackageManager.GET_SIGNATURES);
                if (newInfo == null) {
                    jsLog("VALIDATE: Invalid APK file.");
                    return false;
                }
                
                if (!getPackageName().equals(newInfo.packageName)) {
                    jsLog("VALIDATE: Package name mismatch! Expected " + getPackageName() + " but got " + newInfo.packageName);
                    return false;
                }

                android.content.pm.PackageInfo currentInfo = pm.getPackageInfo(getPackageName(), android.content.pm.PackageManager.GET_SIGNATURES);
                
                if (currentInfo.signatures == null || currentInfo.signatures.length == 0 || newInfo.signatures == null || newInfo.signatures.length == 0) {
                    jsLog("VALIDATE: Signature missing.");
                    return false;
                }
                
                if (!currentInfo.signatures[0].equals(newInfo.signatures[0])) {
                    jsLog("VALIDATE: Signature mismatch! Preventing Package Conflict.");
                    return false;
                }
                
                return true;
            } catch (Exception e) {
                jsLog("VALIDATE ERROR: " + e.getMessage());
                return false;
            }
        }

        private boolean installApkRoot(File apkFile) {
            try {
                Process process = Runtime.getRuntime().exec(new String[]{"su", "-c", "pm install -r -d " + apkFile.getAbsolutePath()});
                int exitValue = process.waitFor();
                if (exitValue == 0) {
                    jsLog("OTA: Root Install Success! Rebooting app...");
                    return true;
                } else {
                    java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getErrorStream()));
                    String line;
                    StringBuilder err = new StringBuilder();
                    while ((line = reader.readLine()) != null) { err.append(line).append(" "); }
                    jsLog("OTA Root Install Error Code " + exitValue + ": " + err.toString());
                    return false;
                }
            } catch (Exception e) {
                jsLog("OTA Root Exception: " + e.getMessage());
                return false;
            }
        }

        private void installApkDeviceOwner(File apkFile) {
            try {
                android.content.pm.PackageInstaller packageInstaller = getPackageManager().getPackageInstaller();
                android.content.pm.PackageInstaller.SessionParams params = new android.content.pm.PackageInstaller.SessionParams(
                        android.content.pm.PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setAppPackageName(getPackageName());
                
                int sessionId = packageInstaller.createSession(params);
                android.content.pm.PackageInstaller.Session session = packageInstaller.openSession(sessionId);
                
                long sizeBytes = apkFile.length();
                java.io.InputStream in = new java.io.FileInputStream(apkFile);
                java.io.OutputStream out = session.openWrite("aqua_ota", 0, sizeBytes);
                
                byte[] buffer = new byte[65536];
                int c;
                while ((c = in.read(buffer)) != -1) {
                    out.write(buffer, 0, c);
                }
                session.fsync(out);
                in.close();
                out.close();
                
                Intent intent = new Intent(Intent.ACTION_MAIN);
                int flags = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE : PendingIntent.FLAG_UPDATE_CURRENT;
                PendingIntent pendingIntent = PendingIntent.getActivity(MainActivity.this, sessionId, intent, flags);
                
                session.commit(pendingIntent.getIntentSender());
                jsLog("OTA: Device Owner installation committed. Waiting for OS to restart app...");
            } catch (Exception e) {
                jsLog("OTA DeviceOwner Install Error: " + e.getMessage());
                installApkFallback(apkFile);
            }
        }

        private void installApkFallback(File apkFile) {
            try {
                android.net.Uri apkUri = androidx.core.content.FileProvider.getUriForFile(MainActivity.this,
                        getPackageName() + ".fileprovider", apkFile);

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
            } catch (Exception e) {
                jsLog("INSTALL FALLBACK ERROR: " + e.getMessage());
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_HOME || keyCode == KeyEvent.KEYCODE_APP_SWITCH
                || keyCode == KeyEvent.KEYCODE_MENU)
            return true;
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        nativeRunning = false;
        if (!activeNativePorts.isEmpty()) {
            for (SerialPort port : activeNativePorts) {
                try {
                    port.getInputStream().close();
                } catch (Exception ignored) {
                }
                try {
                    port.getOutputStream().close();
                } catch (Exception ignored) {
                }
                try {
                    port.close();
                } catch (Exception ignored) {
                }
            }
            activeNativePorts.clear();
        }

        if (ioManager != null) {
            ioManager.stop();
            ioManager = null;
        }
        if (hardwareWatchdogTimer != null) {
            hardwareWatchdogTimer.cancel();
            hardwareWatchdogTimer = null;
        }
        if (fastAnrWatchdogTimer != null) {
            fastAnrWatchdogTimer.cancel();
            fastAnrWatchdogTimer = null;
        }
        if (usbSerialPort != null) {
            try {
                usbSerialPort.close();
            } catch (IOException ignored) {
            }
            usbSerialPort = null;
        }
    }
}
