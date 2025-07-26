const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : require('../firebase-service-account.json');


if (process.env.NODE_ENV === 'development') {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'pic-stream-ai.appspot.com',
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

if (process.env.NODE_ENV === 'production') {
  admin.initializeApp();
}

// Initialize Firebase Auth
const auth = admin.auth();

// Initialize Firebase Firestore
const db = admin.firestore();

let storage;
// Initialize Google Cloud Storage
if (process.env.NODE_ENV === 'development') {
  storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: serviceAccount
  });
}

if (process.env.NODE_ENV === 'production') {
  storage = admin.storage();
}

const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || 'pic-stream-ai.appspot.com');

module.exports = {
  admin,
  auth,
  db,
  storage,
  bucket
}; 