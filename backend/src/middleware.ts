import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from '../legal-casino-3c6cb-firebase-adminsdk-fbsvc-0977b5cf61.json';

const app = initializeApp({
    credential: cert(serviceAccount as any),
})

export const verifyFirebaseToken = async(token: string) => {
    try {
        const result = await getAuth(app).verifyIdToken(token);
        console.log(result);
        return result;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}