import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Logout() {
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut(auth);
        window.location.href = "/signup";
      } catch (error) {
        console.error("Logout failed:", error);
        window.location.href = "/";
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center">
      <p>ログアウト中...</p>
    </div>
  );
}