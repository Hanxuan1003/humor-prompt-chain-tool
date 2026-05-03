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

    const { data: steps, error } = await supabase
        .from("humor_flavor_steps")
        .select("id, order_by")
        .eq("humor_flavor_id", flavorId)
        .order("order_by", { ascending: true })
        .order("id", { ascending: true })

    if (error || !steps) {
        return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
    }

    const index = steps.findIndex((step) => step.id === stepId)

    if (index <= 0) {
        return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
    }

    const reordered = [...steps]
    const temp = reordered[index - 1]
    reordered[index - 1] = reordered[index]
    reordered[index] = temp

    for (let i = 0; i < reordered.length; i++) {
        await supabase
            .from("humor_flavor_steps")
            .update({ order_by: i + 1 })
            .eq("id", reordered[i].id)
    }

    return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
}
