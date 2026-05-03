"use client"

import { createClient } from "@/lib/supabase/client"

export default function LoginButton() {
    const handleLogin = async () => {
        const supabase = createClient()

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <button
            onClick={handleLogin}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
            Sign in with Google
        </button>
    )
}