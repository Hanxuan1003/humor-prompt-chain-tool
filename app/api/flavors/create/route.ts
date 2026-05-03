import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export async function POST(request: Request) {
    const formData = await request.formData()

    const description = String(formData.get("description") ?? "").trim()
    const rawSlug = String(formData.get("slug") ?? "").trim()

    if (!description) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const admin = await requireAdminForRedirect(request)

    if (admin.response) {
        return admin.response
    }

    const { supabase, user } = admin

    const slug = rawSlug || slugify(description)

    const { data } = await supabase
        .from("humor_flavors")
        .insert({
            description,
            slug,
            created_by_user_id: user?.id ?? null,
            modified_by_user_id: user?.id ?? null,
            modified_datetime_utc: new Date().toISOString(),
            is_pinned: false,
        })
        .select("id")
        .single()

    return NextResponse.redirect(
        new URL(data?.id ? `/?flavorId=${data.id}` : "/", request.url)
    )
}
