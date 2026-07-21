const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // We might need this, or use application default credentials.

// Wait, we don't have serviceAccountKey.json. We can use default credentials if we are authenticated, but we are not on GCP.
