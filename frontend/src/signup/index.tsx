import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";
import { GalleryVerticalEnd } from "lucide-react"
import { SignUpForm } from "@/components/signup-form";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Signup() {
    const [openUserIdModal, setOpenUserIdModal] = useState(false);
    const [userId, setUserId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [pendingAuthUser, setPendingAuthUser] = useState<User | null>(null);
    const googleProvider = new GoogleAuthProvider();
    const client = hc<AppType>(import.meta.env.VITE_BACKEND_URL as string);
    const { user } = useAuthContext();
    const registerUserId = async () => {
        setSubmitting(true);
        try {
            const targetUser = pendingAuthUser ?? user;
            if (!targetUser) {
                console.error("User is not authenticated");
                return;
            }
            const idToken = await targetUser.getIdToken();
            if (!idToken) {
                console.error("Failed to get idToken");
                return;
            }
            const res = await client.users.$post(
                {
                    json: {
                        userId: userId.trim(),
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            )
            console.log(await res.json());
            setPendingAuthUser(null);
            window.location.href = "/";
        } catch (error) {
            console.error("Error registering user ID:", error);
        } finally {
            setSubmitting(false);
        }
    }

    const signUpWithEmail = async (email: string, password: string, userId: string) => {
        try {
            if (password.length < 6) {
                console.error("Password should be at least 6 characters");
                return;
            }
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();
            if (!idToken) {
                console.error("Failed to get idToken");
                return;
            }
            await client.users.$post(
                {
                    json: {
                        userId: userId,
                    }
                }
                ,
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            )
            console.log("User created with email:", result.user);
            window.location.href = "/";
        } catch (error) {
            console.error("Error creating user with email:", error);
        }
    }
    /*
    Googleでサインイン後、ユーザが自前DBに登録されているか確認する。
    登録されていなければユーザID登録用のモーダルを表示する。
    登録されていればトップページに遷移する。
    */
    const signUpWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            setPendingAuthUser(result.user);
            const idToken = await result.user.getIdToken();
            if (!idToken) {
                console.error("Failed to get idToken");
                return;
            }
            const res = await client.users.registered.$get(
                {},
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            );
            const data = await res.json();
            if (data && 'registered' in data && !data.registered) {
                setOpenUserIdModal(true);
            } else {
                window.location.href = "/";
            }
        } catch (error) {
            console.error(error);
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
                    <SignUpForm signUpWithEmail={signUpWithEmail} signUpWithGoogle={signUpWithGoogle} />
                </div>
            </div>

            {openUserIdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                        <h2 className="mb-2 text-lg font-semibold">ユーザーIDを登録</h2>
                        <p className="mb-4 text-sm text-gray-600">
                            初回ログインです。ユーザーIDを入力してください。
                        </p>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="userID"
                            className="mb-4 w-full rounded border p-2"
                            minLength={3}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="rounded border px-4 py-2"
                                onClick={() => {
                                    setOpenUserIdModal(false);
                                    setPendingAuthUser(null);
                                }}
                                disabled={submitting}
                            >
                                キャンセル
                            </button>
                            <button
                                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                                onClick={registerUserId}
                                disabled={submitting || !userId.trim()}
                            >
                                {submitting ? "登録中..." : "登録"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}