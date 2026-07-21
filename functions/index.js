/**
 * 🛡️ AQUA STATION — SERVER-SIDE QUOTA ENFORCEMENT
 * Firebase Cloud Functions v1
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const MAX_DAILY_QUOTA = 2.0;

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 FUNCTION 1: หักโควตาฝั่ง Server ทุกครั้งที่ session จบ
// ─────────────────────────────────────────────────────────────────────────────
exports.enforceQuotaOnSessionFinish = functions.region("asia-southeast1").firestore
  .document("sessions/{sessionId}")
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    try {
        await db.collection("debug_logs").add({
            msg: "CF TRIGGERED",
            sessionId: context.params.sessionId,
            beforeStatus: before ? before.status : "null",
            afterStatus: after ? after.status : "null"
        });

        if (!after) {
            await db.collection("debug_logs").add({ msg: "No after", sessionId: context.params.sessionId });
            return null;
        }
    const validStatuses = ["finished", "cancelled", "timeout", "error"];
    if (!validStatuses.includes(after.status)) {
        return null;
    }
    
    if (before && validStatuses.includes(before.status)) {
        await db.collection("debug_logs").add({ msg: "Before status invalid", beforeStatus: before.status, sessionId: context.params.sessionId });
        return null;
    }
    if (after.serverQuotaDeducted === true) {
        await db.collection("debug_logs").add({ msg: "Already deducted", sessionId: context.params.sessionId });
        return null;
    }

    // ถ้าเป็นกรณีหมดเวลาหรือตู้มีปัญหา ให้ถือว่าจ่ายน้ำไป 0 ลิตร (ส่วน cancelled อาจจะกดไปแล้วนิดนึง)
    let finalVol = parseFloat(after.finalVol || 0);
    if (after.status === "timeout" || after.status === "error") {
        finalVol = 0;
    }

    const userUid = after.userUid;
    const sessionId = context.params.sessionId;

    if (!userUid || userUid === "anonymous" || isNaN(finalVol) || finalVol < 0) {
      console.log(`[CF:FINISH] Session ${sessionId}: invalid vol or user, skip.`);
      await db.collection("debug_logs").add({ msg: "Invalid user or vol", userUid, finalVol, sessionId });
      return null;
    }

    console.log(`[CF:FINISH] Session ${sessionId}: deducting ${finalVol}L from user ${userUid}`);
    await db.collection("debug_logs").add({ msg: "Starting transaction", sessionId, finalVol });

    try {
      const userRef = db.collection("users").doc(userUid);
      const sessionRef = db.collection("sessions").doc(sessionId);

      await db.runTransaction(async (t) => {
        const sessionSnap = await t.get(sessionRef);
        if (sessionSnap.exists && sessionSnap.data().serverQuotaDeducted) return;

        const userSnap = await t.get(userRef);
        if (!userSnap.exists) return;

        const ud = userSnap.data();
        const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

        let currentLeft = parseFloat(ud.litersLeft ?? MAX_DAILY_QUOTA);
        let currentExtra = parseFloat(ud.extraQuota ?? 0);

        // 🛡️ ฟื้นฟูโควตาเดิมกลับมาก่อน (ถ้าถูกล็อคไว้)
        if (ud.preDeductedLiters !== undefined) {
            currentLeft = parseFloat(ud.preDeductedLiters);
        }
        if (ud.preDeductedExtra !== undefined) {
            currentExtra = parseFloat(ud.preDeductedExtra);
        }

        if (ud.lastQuotaResetDate !== todayStr) {
          let maxForToday = MAX_DAILY_QUOTA;
          if (ud.quota !== undefined && ud.quota !== null && ud.quota !== "") {
            let parsed = parseFloat(ud.quota);
            if (!Number.isNaN(parsed)) maxForToday = parsed;
          } else if (ud.customQuota !== undefined && ud.customQuota !== null && ud.customQuota !== "") {
            let parsed = parseFloat(ud.customQuota);
            if (!Number.isNaN(parsed)) maxForToday = parsed;
          }
          currentLeft = maxForToday;
          currentExtra = parseFloat(ud.extraQuota ?? 0);
          if (Number.isNaN(currentExtra)) currentExtra = 0;
        }

        if (Number.isNaN(currentLeft)) currentLeft = 0;
        if (Number.isNaN(currentExtra)) currentExtra = 0;

        const totalAvailable = currentLeft + currentExtra;
        const remaining = Math.max(0, totalAvailable - finalVol);
        const newExtra = Math.min(currentExtra, remaining);
        const newLeft = remaining - newExtra;

        console.log(`[CF:FINISH] User ${userUid}: before=(left=${currentLeft}, extra=${currentExtra}), dispensed=${finalVol}L → after=(left=${newLeft.toFixed(3)}, extra=${newExtra.toFixed(3)})`);

        t.update(userRef, {
          litersLeft: newLeft,
          extraQuota: newExtra > 0 ? newExtra : 0,
          lastQuotaResetDate: todayStr,
          isDispensing: admin.firestore.FieldValue.delete(),
          lockTime: admin.firestore.FieldValue.delete(),
          lockedByMachine: admin.firestore.FieldValue.delete(),
          preDeductedLiters: admin.firestore.FieldValue.delete(),
          preDeductedExtra: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        t.update(sessionRef, { serverQuotaDeducted: true });
      });

        console.log(`[CF:FINISH] ✅ Quota deducted successfully for session ${sessionId}`);
        await db.collection("debug_logs").add({ msg: "Transaction SUCCESS", sessionId });
      } catch (err) {
        console.error(`[CF:FINISH] ❌ Transaction failed for session ${sessionId}:`, err);
        await db.collection("debug_logs").add({ msg: "Transaction ERROR", errStr: String(err), errMessage: err.message, sessionId });
      }
      return null;
    } catch (globalErr) {
      await db.collection("debug_logs").add({ msg: "GLOBAL ERROR", errStr: String(globalErr), errMessage: globalErr.message, stack: globalErr.stack, sessionId: context.params.sessionId });
      return null;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// 🟡 FUNCTION 2: Pre-Deduct โควตาทันทีเมื่อ session เริ่ม
// ─────────────────────────────────────────────────────────────────────────────
exports.preDeductQuotaOnSessionStart = functions.region("asia-southeast1").firestore
  .document("sessions/{sessionId}")
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (before && before.status) return null;
    if (!after || after.status !== "confirmed") return null;
    if (after.serverPreDeducted === true) return null;

    const userUid = after.userUid;
    const sessionId = context.params.sessionId;

    if (!userUid || userUid === "anonymous") return null;

    console.log(`[CF:START] Session ${sessionId}: pre-deducting quota for user ${userUid}`);

    try {
      const userRef = db.collection("users").doc(userUid);
      let quotaAvailable = 0;
      let isBlocked = false;

      const sessionRef = db.collection("sessions").doc(sessionId);

      await db.runTransaction(async (t) => {
        const sessionSnap = await t.get(sessionRef);
        if (sessionSnap.exists) {
            const currentStatus = sessionSnap.data().status;
            if (currentStatus === "finished" || currentStatus === "cancelled" || currentStatus === "timeout" || currentStatus === "error") {
                console.log(`[CF:START] Session ${sessionId} already finished/cancelled (${currentStatus}). Aborting pre-deduct.`);
                return;
            }
            if (sessionSnap.data().serverPreDeducted) return;
        }

        const userSnap = await t.get(userRef);
        if (!userSnap.exists) {
          isBlocked = true;
          return;
        }

        const ud = userSnap.data();
        let currentLeft = parseFloat(ud.litersLeft ?? MAX_DAILY_QUOTA);
        let currentExtra = parseFloat(ud.extraQuota ?? 0);

        // 🛡️ [CRITICAL FIX] If preDeductedLiters exists, it means the previous session was orphaned (e.g. browser closed).
        // We MUST restore it here before we overwrite it with litersLeft = 0.
        if (ud.preDeductedLiters !== undefined) {
            currentLeft = parseFloat(ud.preDeductedLiters);
        }
        if (ud.preDeductedExtra !== undefined) {
            currentExtra = parseFloat(ud.preDeductedExtra);
        }

        const todayResetStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
        if (ud.lastQuotaResetDate !== todayResetStr) {
          let maxForToday = MAX_DAILY_QUOTA;
          if (ud.quota !== undefined && ud.quota !== null && ud.quota !== "") {
            let parsed = parseFloat(ud.quota);
            if (!Number.isNaN(parsed)) maxForToday = parsed;
          } else if (ud.customQuota !== undefined && ud.customQuota !== null && ud.customQuota !== "") {
            let parsed = parseFloat(ud.customQuota);
            if (!Number.isNaN(parsed)) maxForToday = parsed;
          }
          currentLeft = maxForToday;
        }

        if (Number.isNaN(currentLeft)) currentLeft = 0;
        if (Number.isNaN(currentExtra)) currentExtra = 0;

        quotaAvailable = currentLeft + currentExtra;

        if (quotaAvailable <= 0) {
          isBlocked = true;
          return;
        }

        t.update(userRef, {
          litersLeft: 0,
          lastQuotaResetDate: todayResetStr,
          isDispensing: true,
          lockTime: Date.now(),
          lockedByMachine: after.kioskId || "CF_LOCK",
          preDeductedLiters: currentLeft,
          preDeductedExtra: currentExtra,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        if (isBlocked) {
          t.update(sessionRef, {
            status: "quota_exceeded",
            serverPreDeducted: true,
            blockedReason: "Quota exhausted (server-side check)"
          });
        } else {
          t.update(sessionRef, {
            serverPreDeducted: true,
            quotaAvailable: quotaAvailable
          });
        }
      });

      if (isBlocked) {
        console.log(`[CF:START] ❌ Session ${sessionId} BLOCKED — quota exhausted`);
      } else {
        console.log(`[CF:START] ✅ Session ${sessionId} pre-deducted OK.`);
      }
    } catch (err) {
      console.error(`[CF:START] ❌ Transaction failed for session ${sessionId}:`, err);
    }
    return null;
  });

// ─────────────────────────────────────────────────────────────────────────────
// 🔵 FUNCTION 3: CRON JOB - Reset Quota สำหรับทุกคนตอนเที่ยงคืน (Asia/Bangkok)
// ─────────────────────────────────────────────────────────────────────────────
exports.dailyQuotaReset = functions.region("asia-southeast1").pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Bangkok")
  .onRun(async (context) => {
    console.log("⏰ [CRON] Starting daily quota reset for all users at midnight...");
    
    try {
        const usersRef = db.collection("users");
        const snapshot = await usersRef.get();
        
        if (snapshot.empty) {
            console.log("⏰ [CRON] No users found. Exiting.");
            return null;
        }

        const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
        
        // 1. อ่านค่า Config จากฐานข้อมูล
        let inAreaVol = 2.0;
        let outAreaVol = 2.0;
        let inAreaSubdistricts = [];
        let inAreaDistricts = [];
        let inAreaProvinces = [];
        
        try {
            const configSnap = await db.collection("settings").doc("quota_config").get();
            if (configSnap.exists) {
                const conf = configSnap.data();
                inAreaVol = parseFloat(conf.inAreaVol || 2.0);
                outAreaVol = parseFloat(conf.outAreaVol || 2.0);
                inAreaSubdistricts = conf.inAreaSubdistricts || [];
                inAreaDistricts = conf.inAreaDistricts || [];
                inAreaProvinces = conf.inAreaProvinces || [];
            }
        } catch (e) {
            console.error("⏰ [CRON] Failed to fetch quota_config", e);
        }

        const batches = [];
        let batch = db.batch();
        let count = 0;

        // 2. ลูปตรวจสอบทุกคน
        snapshot.docs.forEach((doc) => {
            const ud = doc.data();
            
            let calculatedMax = 2.0;
            if (ud.quota !== undefined && ud.quota !== null && ud.quota !== "") {
                calculatedMax = parseFloat(ud.quota);
            } else if (ud.customQuota !== undefined && ud.customQuota !== null && ud.customQuota !== "") {
                calculatedMax = parseFloat(ud.customQuota);
            } else {
                const isAreaMatch = inAreaSubdistricts.includes(ud.subdistrict) ||
                                    inAreaDistricts.includes(ud.district) ||
                                    inAreaProvinces.includes(ud.province);
                calculatedMax = isAreaMatch ? inAreaVol : outAreaVol;
            }

            // รีเซ็ตเฉพาะคนที่ยังไม่ถูกรีเซ็ตในวันนี้ หรือยอดไม่เต็ม
            if (ud.lastQuotaResetDate !== todayStr || parseFloat(ud.litersLeft) !== calculatedMax) {
                batch.update(doc.ref, {
                    litersLeft: calculatedMax,
                    lastQuotaResetDate: todayStr
                });
                count++;

                // Commit ทยอยเขียนทีละ 500 records (ลิมิตของ Firestore Batch)
                if (count === 500) {
                    batches.push(batch.commit());
                    batch = db.batch();
                    count = 0;
                }
            }
        });

        if (count > 0) {
            batches.push(batch.commit());
        }

        await Promise.all(batches);
        const totalUpdated = (batches.length > 0 ? (batches.length - 1) * 500 : 0) + count;
        console.log(`⏰ [CRON] Successfully reset quota for ${totalUpdated} users!`);
    } catch (globalErr) {
        console.error("⏰ [CRON] Critical error during daily quota reset:", globalErr);
    }
    
    return null;
  });
