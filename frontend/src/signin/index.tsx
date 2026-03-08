import { SignInForm } from "@/components/signin-form";
import { GalleryVerticalEnd } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { signInWithPopup, GoogleAuthProvider, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";

const googleProvider = new GoogleAuthProvider();

export default function SignIn() {
    const { user, loading } = useAuthContext();
    const client = hc<AppType>(import.meta.env.VITE_BACKEND_URL as string);
    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    if (user) {
        window.location.href = "/";
        return null;
    }
    const signInWithEmail = async (identifier: string, password: string) => {
        try {
            const res = await client.users["sign-in"].$post({
                json: {
                    identifier: identifier.trim(),
                    password,
                },
            });
            if (!res.ok) {
                throw new Error("Invalid credentials");
            }
            const data = await res.json();
            if (!("customToken" in data)) {
                throw new Error("Invalid credentials");
            }
            await signInWithCustomToken(auth, data.customToken);
            window.location.href = "/";
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };
    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            window.location.href = "/";
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    }
    return (
        <>
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
                <div className="flex w-full max-w-sm flex-col gap-6">
                    <a href="#" className="flex items-center gap-2 self-center font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Legal Casino
                    </a>
                    <SignInForm signInWithEmail={signInWithEmail} signInWithGoogle={signInWithGoogle} />
                </div>
            </div>
        </>
    )
}