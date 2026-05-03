import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const formData = await request.formData()

    const stepId = Number(formData.get("stepId"))
    const flavorId = Number(formData.get("flavorId"))

    if (!stepId || !flavorId) {
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
        .eq("id", stepId)
        .eq("humor_flavor_id", flavorId)

    const { data: steps } = await supabase
        .from("humor_flavor_steps")
        .select("id")
        .eq("humor_flavor_id", flavorId)
        .order("order_by", { ascending: true })
        .order("id", { ascending: true })

    if (steps) {
        for (let i = 0; i < steps.length; i++) {
            await supabase
                .from("humor_flavor_steps")
                .update({ order_by: i + 1 })
                .eq("id", steps[i].id)
        }
    }

    return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
}
