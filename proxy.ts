import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )

                    response = NextResponse.next({
                        request,
                    })

                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/auth/callback") ||
        pathname.startsWith("/access-denied")
    ) {
        return response
    }

    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin, is_matrix_admin")
        .eq("id", user.id)
        .single()

    const allowed = profile?.is_superadmin || profile?.is_matrix_admin

    if (!allowed) {
        return NextResponse.redirect(new URL("/access-denied", request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all paths except static files and Next internals.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
}
