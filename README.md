# Aqua Station Kiosk Application

## ⚠️ CRITICAL ARCHITECTURE RULES

### 1. The Main Application Entry Point
**The sole production entry point for the Kiosk Application is `www/station-v121.html`.**

- NEVER build the Android APK using any other HTML files.
- `station-v121.html` contains the complete implementation including the Master Console, Ads Engine, Sensor Telemetry (TDS/Flow), and Firebase integration.
- The `build-apk.yml` script in GitHub Actions strictly uses `station-v121.html` as `www/index.html`.

### 2. File Organization
- `www/station-v121.html` -> Main Kiosk Interface (Android App)
- `admin.html` -> Web Dashboard for Remote Management
- `scripts/` -> Utility scripts for OTA updates and database management

### 3. OTA (Over-The-Air) Updates
OTA updates are handled per-machine via Firebase Realtime listeners.
To update a specific machine, set the following fields in its Firestore document (`machines/{DEVICE_ID}`):
- **Web OTA (Fastest, UI updates only):**
  - `target_web_version`: e.g. "1.2.0"
  - `target_web_zip_url`: e.g. "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/www.zip"
- **APK OTA (Full Android Update):**
  - `ota_target_version`: e.g. "2.0.57"
  - `ota_apk_url`: e.g. "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk"
  - `ota_force_update`: true

### 4. TDS Calibration
TDS values read from the serial board are raw values. They are calibrated using `tdsInMultiplier` and `tdsOutMultiplier`.
These multipliers can be adjusted dynamically in the `machines/{DEVICE_ID}` Firebase document. By default, they are set to `1.0`.

## Legacy Files (Do Not Use)
- `tablet-kiosk.html` has been removed as it was an incomplete prototype. Do not recreate or use it.
