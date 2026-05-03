import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const formData = await request.formData()

    const flavorId = Number(formData.get("flavorId"))
    const description = String(formData.get("description") ?? "").trim()
    const slug = String(formData.get("slug") ?? "").trim()
    const isPinned = formData.get("isPinned") === "on"

    if (!flavorId || !description) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const admin = await requireAdminForRedirect(request)

    if (admin.response) {
        return admin.response
    }

    const { supabase, user } = admin

    await supabase
        .from("humor_flavors")
        .update({
            description,
            slug,
            is_pinned: isPinned,
            modified_by_user_id: user?.id ?? null,
            modified_datetime_utc: new Date().toISOString(),
        })
        .eq("id", flavorId)

    return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
}
