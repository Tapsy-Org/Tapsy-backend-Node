import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';

// Choose correct env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Validate required vars
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_CLIENT_X509_CERT_URL',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // handle multiline key
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    clientCrtUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  } as admin.ServiceAccount),
});

export default admin;
