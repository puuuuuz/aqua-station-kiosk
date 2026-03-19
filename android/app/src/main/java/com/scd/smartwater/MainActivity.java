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

        // ── Kiosk Mode: Keep screen on always ──
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // ── Kiosk Mode: Lock Task (ปิดปุ่ม Home / Recent Apps) ──
        // หมายเหตุ: ต้องตั้งแอปนี้เป็น Device Owner ก่อน หรือ App Pinning ด้วยมือ
        // (ดูวิธีตั้งค่า Device Owner ใน README ที่ผมสร้างให้)
        try {
            startLockTask();
        } catch (Exception e) {
            // ถ้ายังไม่ได้ตั้งเป็น Device Owner จะ fallback เป็น Screen Pinning แทน
            e.printStackTrace();
        }

        // ── Fullscreen Immersive Mode ──
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // ซ่อน Navigation bar ใหม่ทุกครั้งที่หน้าต่างได้ Focus กลับมา
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

