import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function getAdminAccess() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { supabase, user: null, allowed: false }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin, is_matrix_admin")
        .eq("id", user.id)
        .single()

    const allowed = Boolean(profile?.is_superadmin || profile?.is_matrix_admin)

    return { supabase, user, allowed }
}

export async function requireAdminForRedirect(request: Request) {
    const { supabase, user, allowed } = await getAdminAccess()

    if (!user) {
        return { response: NextResponse.redirect(new URL("/login", request.url)) }
    }

    if (!allowed) {
        return {
            response: NextResponse.redirect(new URL("/access-denied", request.url)),
        }
    }

    return { supabase: supabase as SupabaseServerClient, user }
}

export async function requireAdminForJson() {
    const { supabase, user, allowed } = await getAdminAccess()

    if (!user) {
        return {
            response: NextResponse.json(
                { error: "You must be signed in to use this tool." },
                { status: 401 }
            ),
        }
    }

    if (!allowed) {
        return {
            response: NextResponse.json(
                { error: "You do not have permission to use this tool." },
                { status: 403 }
            ),
        }
    }

    return { supabase: supabase as SupabaseServerClient, user }
}
