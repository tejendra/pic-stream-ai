const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'pic-stream-ai.appspot.com',
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Initialize Firebase Auth
const auth = admin.auth();

// Initialize Firebase Firestore
const db = admin.firestore();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount
});

const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || 'pic-stream-ai.appspot.com');

module.exports = {
  admin,
  auth,
  db,
  storage,
  bucket
}; 