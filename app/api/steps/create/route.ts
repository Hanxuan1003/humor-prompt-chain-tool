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

    const { data: steps } = await supabase
        .from("humor_flavor_steps")
        .select("order_by")
        .eq("humor_flavor_id", flavorId)
        .order("order_by", { ascending: false })
        .limit(1)

    const nextOrder = steps && steps.length > 0 ? (steps[0].order_by ?? 0) + 1 : 1

    await supabase.from("humor_flavor_steps").insert({
        humor_flavor_id: flavorId,
        order_by: nextOrder,
        llm_temperature: 0.7,
        llm_model_id: 1,
        llm_input_type_id: 1,
        llm_output_type_id: 1,
        humor_flavor_step_type_id: 1,
        llm_system_prompt: "",
        llm_user_prompt: "",
        description: "New step",
    })

    return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
}
