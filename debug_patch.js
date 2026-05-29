const fs = require('fs');
let code = fs.readFileSync('liff-app.html', 'utf8');

const oldSetDoc = `                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('การเชื่อมต่อกับเซิร์ฟเวอร์ขัดข้อง (Timeout) โปรดลองใหม่อีกครั้ง')), 10000));
                await Promise.race([setDocPromise, timeoutPromise]);
                
                console.log("✅ [Register] Success! Moving to dashboard...");`;

const newSetDoc = `                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('การเชื่อมต่อกับเซิร์ฟเวอร์ขัดข้อง (Timeout) โปรดลองใหม่อีกครั้ง')), 10000));
                await Promise.race([setDocPromise, timeoutPromise]);
                
                alert("DEBUG: บันทึก Firestore สำเร็จ (setDoc resolved)!");
                console.log("✅ [Register] Success! Moving to dashboard...");`;

if (code.includes(oldSetDoc)) {
    code = code.replace(oldSetDoc, newSetDoc);
    fs.writeFileSync('liff-app.html', code);
    console.log("Patched liff-app.html successfully");
} else {
    console.log("Could not find oldSetDoc in liff-app.html");
}
