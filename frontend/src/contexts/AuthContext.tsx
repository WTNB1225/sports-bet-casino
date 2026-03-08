import { createContext, useContext } from "react";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

export type GlobalAuthState = {
  user: User | null | undefined
}

const initialState: GlobalAuthState = {
    user: undefined,
}

const AuthContext = createContext<GlobalAuthState>(initialState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<GlobalAuthState>(initialState);

  useEffect(() => {
    try {
        return onAuthStateChanged(auth, (user) => {
        setUser({ user });
    })
    } catch (error) {
        console.error("Error setting up auth state listener:", error);
        setUser(initialState);
    }
  }, []);

  return (
    <AuthContext.Provider value={user}>
        {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)