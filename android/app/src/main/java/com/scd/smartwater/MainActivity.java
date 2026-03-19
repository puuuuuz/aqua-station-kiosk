package com.scd.smartwater;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Kiosk Mode: Keep screen on ──
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // ── Fullscreen Immersive Mode (Legacy & Modern Support) ──
        hideSystemUI();

        // ── Kiosk Mode: Request Lock Task ──
        // (Will only lock properly if Device Admin is set via ADB correctly)
        try {
            startLockTask();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void hideSystemUI() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            // Android 30 (R) and above
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            // Below Android 30
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
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onBackPressed() {
        // บล็อกปุ่ม Back ไม่ให้ออกจากแอป
        // super.onBackPressed() ← ไม่เรียก
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // บล็อกปุ่ม Volume, Home ฯลฯ ไม่ให้ทำอะไรได้
        if (keyCode == KeyEvent.KEYCODE_HOME
                || keyCode == KeyEvent.KEYCODE_APP_SWITCH
                || keyCode == KeyEvent.KEYCODE_MENU) {
            return true; // กลืนคำสั่ง
        }
        return super.onKeyDown(keyCode, event);
    }
}

