import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const formData = await request.formData()

    const stepId = Number(formData.get("stepId"))
    const flavorId = Number(formData.get("flavorId"))

    const llmTemperature = Number(formData.get("llmTemperature"))
    const llmModelId = Number(formData.get("llmModelId"))
    const llmInputTypeId = Number(formData.get("llmInputTypeId"))
    const llmOutputTypeId = Number(formData.get("llmOutputTypeId"))
    const humorFlavorStepTypeId = Number(formData.get("humorFlavorStepTypeId"))

    const description = String(formData.get("description") ?? "")
    const llmSystemPrompt = String(formData.get("llmSystemPrompt") ?? "")
    const llmUserPrompt = String(formData.get("llmUserPrompt") ?? "")

    if (!stepId || !flavorId) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const admin = await requireAdminForRedirect(request)

    if (admin.response) {
        return admin.response
    }

    const { supabase, user } = admin

    await supabase
        .from("humor_flavor_steps")
        .update({
            llm_temperature: Number.isFinite(llmTemperature) ? llmTemperature : 0.7,
            llm_model_id: Number.isFinite(llmModelId) ? llmModelId : null,
            llm_input_type_id: Number.isFinite(llmInputTypeId) ? llmInputTypeId : null,
            llm_output_type_id: Number.isFinite(llmOutputTypeId)
                ? llmOutputTypeId
                : null,
            humor_flavor_step_type_id: Number.isFinite(humorFlavorStepTypeId)
                ? humorFlavorStepTypeId
                : null,
            description,
            llm_system_prompt: llmSystemPrompt,
            llm_user_prompt: llmUserPrompt,
            modified_by_user_id: user?.id ?? null,
            modified_datetime_utc: new Date().toISOString(),
        })
        .eq("id", stepId)
        .eq("humor_flavor_id", flavorId)

    return NextResponse.redirect(new URL(`/?flavorId=${flavorId}`, request.url))
}
