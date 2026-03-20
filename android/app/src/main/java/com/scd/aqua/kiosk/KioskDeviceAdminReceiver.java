package com.scd.aqua.kiosk;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import androidx.annotation.NonNull;

public class KioskDeviceAdminReceiver extends DeviceAdminReceiver {
    @Override
    public void onEnabled(@NonNull Context context, @NonNull Intent intent) {
        Toast.makeText(context, "Kiosk Mode: Device Admin Enabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onLockTaskModeEntering(@NonNull Context context, @NonNull Intent intent, @NonNull String pkg) {
        Toast.makeText(context, "Kiosk Mode: Locking App...", Toast.LENGTH_SHORT).show();
    }
}
