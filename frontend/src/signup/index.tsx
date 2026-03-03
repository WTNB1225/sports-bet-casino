import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";

export default function Signup() {
    const googleProvider = new GoogleAuthProvider();
    const client = hc<AppType>('http://localhost:3030');
    const signInWithGoogle = async() => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const email = result.user.email;
            const name = result.user.displayName;
            if (!email || !name) {
                throw new Error("Google account email or display name is missing.");
            }
            const res = await client.users.$post({
                json: {
                    email,
                    name,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            })
            console.log(result);
            console.log(res);
        } catch (error) {
            console.error(error);
        }
    }
    return (
        <div>
            <h1>Signup</h1>
            <button onClick={signInWithGoogle}>Sign up with Google</button>
        </div>
    )
}