package com.scd.kiosk.aqua;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver — เปิด App อัตโนมัติเมื่อ Android boot เสร็จ
 *
 * ทำงานเมื่อ:
 *  - Android boot ปกติ (BOOT_COMPLETED)
 *  - Android quick boot / wake from deep sleep (QUICKBOOT_POWERON)
 *
 * ต้อง register ใน AndroidManifest.xml พร้อม permission RECEIVE_BOOT_COMPLETED
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        final String action = intent.getAction();
        if (action == null) return;

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {

            Log.i(TAG, "✅ Boot completed (" + action + ") — launching kiosk app...");

            try {
                Intent launchIntent = context.getPackageManager()
                        .getLaunchIntentForPackage(context.getPackageName());

                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                    context.startActivity(launchIntent);
                    Log.i(TAG, "✅ Kiosk app launched after boot.");
                } else {
                    Log.e(TAG, "❌ Launch intent is null — cannot auto-start app.");
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to launch app after boot: " + e.getMessage());
            }
        }
    }
}
