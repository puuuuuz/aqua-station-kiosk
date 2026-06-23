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

      await db.runTransaction(async (t) => {
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
          if (ud.customQuota !== undefined && ud.customQuota !== null && ud.customQuota !== "") {
            maxForToday = parseFloat(ud.customQuota);
          }
          currentLeft = maxForToday;
          currentExtra = parseFloat(ud.extraQuota ?? 0);
        }

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
        });
      });

        await change.after.ref.update({ serverQuotaDeducted: true });
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

      await db.runTransaction(async (t) => {
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) {
          isBlocked = true;
          return;
        }

        const ud = userSnap.data();
        const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });

        let currentLeft = parseFloat(ud.litersLeft ?? 0);
        let currentExtra = parseFloat(ud.extraQuota ?? 0);

        if (ud.lastQuotaResetDate !== todayStr) {
          let maxForToday = MAX_DAILY_QUOTA;
          if (ud.customQuota !== undefined && ud.customQuota !== null && ud.customQuota !== "") {
            maxForToday = parseFloat(ud.customQuota);
          }
          currentLeft = maxForToday;
        }

        quotaAvailable = currentLeft + currentExtra;

        if (quotaAvailable <= 0) {
          isBlocked = true;
          return;
        }

        const todayResetStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
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
      });

      if (isBlocked) {
        await change.after.ref.update({
          status: "quota_exceeded",
          serverPreDeducted: true,
          blockedReason: "Quota exhausted (server-side check)"
        });
        console.log(`[CF:START] ❌ Session ${sessionId} BLOCKED — quota exhausted`);
      } else {
        await change.after.ref.update({
          serverPreDeducted: true,
          quotaAvailable: quotaAvailable
        });
        console.log(`[CF:START] ✅ Session ${sessionId} pre-deducted OK. quota=${quotaAvailable}L`);
      }
    } catch (err) {
      console.error(`[CF:START] ❌ Transaction failed for session ${sessionId}:`, err);
    }
    return null;
  });
