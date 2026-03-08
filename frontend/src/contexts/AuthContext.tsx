import { createContext, useContext } from "react";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

export type GlobalAuthState = {
  user: User | null | undefined
  loading: boolean
}

const initialState: GlobalAuthState = {
    user: undefined,
    loading: true,
}

const AuthContext = createContext<GlobalAuthState>(initialState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(initialState.user);
  const [loading, setLoading] = useState(initialState.loading);

  useEffect(() => {
    try {
        return onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
    })
    } catch (error) {
        console.error("Error setting up auth state listener:", error);
        setUser(initialState.user);
        setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
        {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)