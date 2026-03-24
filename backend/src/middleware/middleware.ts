import "dotenv/config";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in environment variables");
}

const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    })
})

const auth = getAuth(app);

export const verifyFirebaseToken = async(token: string) => {
    try {
        const result = await auth.verifyIdToken(token);
        return result;
    }
    catch (error) {
        console.error("Error verifying Firebase token:", error);
        throw error;
    }
}

export const createFirebaseCustomToken = async (uid: string) => {
    try {
        return await auth.createCustomToken(uid);
    } catch (error) {
        console.error("Error creating Firebase custom token:", error);
        throw error;
    }
}