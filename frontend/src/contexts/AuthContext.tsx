import { createContext, useContext } from "react";
import { onAuthStateChanged, type User } from '@firebase/auth';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

export type GlobalAuthState = {
  user: User | null | undefined
}

const initalState: GlobalAuthState = {
    user: undefined,
}

const AuthContext = createContext<GlobalAuthState>(initalState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<GlobalAuthState>(initalState);

  useEffect(() => {
    try {
        return onAuthStateChanged(auth, (user) => {
        setUser({ user });
    })
    } catch (error) {
        console.error("Error setting up auth state listener:", error);
        setUser(initalState);
    }
  }, []);

  return (
    <AuthContext.Provider value={user}>
        {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)