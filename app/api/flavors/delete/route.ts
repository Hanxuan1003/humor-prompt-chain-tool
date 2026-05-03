import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const formData = await request.formData()

    const flavorId = Number(formData.get("flavorId"))

    if (!flavorId) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const admin = await requireAdminForRedirect(request)

    if (admin.response) {
        return admin.response
    }

    const { supabase } = admin

    await supabase
        .from("humor_flavor_steps")
        .delete()
        .eq("humor_flavor_id", flavorId)

    await supabase
        .from("humor_flavors")
        .delete()
        .eq("id", flavorId)

    return NextResponse.redirect(new URL("/", request.url))
}
