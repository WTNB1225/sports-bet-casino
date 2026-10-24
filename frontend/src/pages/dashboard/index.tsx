import { useAuthContext } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Dashborad() {
    const { user } = useAuthContext();
    return (
        <div className="flex min-h-full items-center justify-center">
            <p>Welcome, {user?.email}</p>
        </div>
    )
}