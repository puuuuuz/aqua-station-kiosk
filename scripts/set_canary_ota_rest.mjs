const url = "https://firestore.googleapis.com/v1/projects/siam-circuit/databases/(default)/documents/machines/5cc58f943af49e79?updateMask.fieldPaths=target_apk_version&updateMask.fieldPaths=target_apk_url&key=AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ";
const body = {
  fields: {
    target_apk_version: { stringValue: "Test 2.0.24 UI Remove Button" },
    target_apk_url: { stringValue: "https://github.com/puuuuuz/aqua-station-kiosk/releases/download/latest/app-debug.apk?v=2024" }
  }
};
fetch(url, { method: "PATCH", body: JSON.stringify(body) })
  .then(res => res.text())
  .then(text => {
    console.log("Firebase REST API Response:", text);
    process.exit(0);
  });
