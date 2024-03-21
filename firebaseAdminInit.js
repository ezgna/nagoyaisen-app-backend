const admin = require('firebase-admin');
const serviceAccount = require('./nagoyaisen-app-firebase-adminsdk-n99a8-56c5212028.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin.firestore();

