import { requireAdminForRedirect } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

type ExistingFlavor = {
    description: string | null
    slug: string | null
}

type SourceStep = {
    order_by: number | null
    llm_temperature: number | null
    llm_model_id: number | null
    llm_input_type_id: number | null
    llm_output_type_id: number | null
    humor_flavor_step_type_id: number | null
    llm_system_prompt: string | null
    llm_user_prompt: string | null
    description: string | null
}

function slugify(text: string) {
    return (
        text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "flavor"
    )
}

function getUniqueDescription(description: string, flavors: ExistingFlavor[]) {
    const existingDescriptions = new Set(
        flavors
            .map((flavor) => flavor.description?.trim().toLowerCase())
            .filter(Boolean)
    )

    if (!existingDescriptions.has(description.toLowerCase())) {
        return description
    }

    let copyNumber = 2
    let candidate = `${description} Copy`

    while (existingDescriptions.has(candidate.toLowerCase())) {
        candidate = `${description} Copy ${copyNumber}`
        copyNumber += 1
    }

    return candidate
}

function getUniqueSlug(description: string, flavors: ExistingFlavor[]) {
    const existingSlugs = new Set(
        flavors.map((flavor) => flavor.slug?.trim().toLowerCase()).filter(Boolean)
    )
    const baseSlug = slugify(description)

    if (!existingSlugs.has(baseSlug)) {
        return baseSlug
    }

    let copyNumber = 2
    let candidate = `${baseSlug}-copy`

    while (existingSlugs.has(candidate)) {
        candidate = `${baseSlug}-copy-${copyNumber}`
        copyNumber += 1
    }

    return candidate
}

export async function POST(request: Request) {
    const formData = await request.formData()

    const sourceFlavorId = Number(formData.get("flavorId"))
    const requestedDescription = String(formData.get("newDescription") ?? "").trim()

    if (!sourceFlavorId || !requestedDescription) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const admin = await requireAdminForRedirect(request)

    if (admin.response) {
        return admin.response
    }

    const { supabase, user } = admin

    const { data: sourceFlavor } = await supabase
        .from("humor_flavors")
        .select("id")
        .eq("id", sourceFlavorId)
        .single()

    if (!sourceFlavor) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    const { data: existingFlavors } = await supabase
        .from("humor_flavors")
        .select("description, slug")

    const flavors = (existingFlavors ?? []) as ExistingFlavor[]
    const description = getUniqueDescription(requestedDescription, flavors)
    const slug = getUniqueSlug(description, flavors)

    const { data: newFlavor } = await supabase
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

    if (!newFlavor?.id) {
        return NextResponse.redirect(new URL(`/?flavorId=${sourceFlavorId}`, request.url))
    }

    const { data: sourceSteps } = await supabase
        .from("humor_flavor_steps")
        .select(
            "order_by, llm_temperature, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, description"
        )
        .eq("humor_flavor_id", sourceFlavorId)
        .order("order_by", { ascending: true })
        .order("id", { ascending: true })

    const copiedSteps = ((sourceSteps ?? []) as SourceStep[]).map((step, index) => ({
        humor_flavor_id: newFlavor.id,
        order_by: step.order_by ?? index + 1,
        llm_temperature: step.llm_temperature,
        llm_model_id: step.llm_model_id,
        llm_input_type_id: step.llm_input_type_id,
        llm_output_type_id: step.llm_output_type_id,
        humor_flavor_step_type_id: step.humor_flavor_step_type_id,
        llm_system_prompt: step.llm_system_prompt,
        llm_user_prompt: step.llm_user_prompt,
        description: step.description,
    }))

    if (copiedSteps.length > 0) {
        await supabase.from("humor_flavor_steps").insert(copiedSteps)
    }

    return NextResponse.redirect(new URL(`/?flavorId=${newFlavor.id}`, request.url))
}
