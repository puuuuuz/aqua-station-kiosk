const apiKey = "AIzaSyBuV5BoTuxSLB5yiW1TBoQ3uh_Ls6THBJQ";
const projectId = "siam-circuit";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

const query = {
  structuredQuery: {
    from: [{ collectionId: "machine_logs" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "machineId" },
        op: "EQUAL",
        value: { stringValue: "199459fcd2cf8a74" }
      }
    },
    limit: 1
  }
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(query)
})
.then(res => res.json())
.then(data => {
  if (data[0] && data[0].document) {
    console.log("Name:", data[0].document.fields.machineName.stringValue);
  } else {
    console.log("Not found in logs.");
  }
})
.catch(console.error);
