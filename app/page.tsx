import { createClient } from "@/lib/supabase/server"
import TestFlavorForm from "@/app/components/test-flavor-form"
import ConfirmSubmitButton from "@/app/components/confirm-submit-button"
import ThemeModeControl from "@/app/components/theme-mode-control"
type HumorFlavor = {
    id: number
    description: string | null
    slug: string | null
    is_pinned: boolean | null
}

type HumorFlavorStep = {
    id: number
    humor_flavor_id: number
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

export default async function Home({
                                       searchParams,
                                   }: {
    searchParams?: Promise<{ flavorId?: string }>
}) {
    const params = await searchParams
    const selectedFlavorId = params?.flavorId ? Number(params.flavorId) : null

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: flavors, error: flavorsError } = await supabase
        .from("humor_flavors")
        .select("id, description, slug, is_pinned")
        .order("is_pinned", { ascending: false })
        .order("id", { ascending: false })
        .limit(50)

    let steps: HumorFlavorStep[] = []

    if (selectedFlavorId) {
        const { data: stepData } = await supabase
            .from("humor_flavor_steps")
            .select(
                "id, humor_flavor_id, order_by, llm_temperature, llm_model_id, llm_input_type_id, llm_output_type_id, humor_flavor_step_type_id, llm_system_prompt, llm_user_prompt, description"
            )
            .eq("humor_flavor_id", selectedFlavorId)
            .order("order_by", { ascending: true })
            .order("id", { ascending: true })

        steps = stepData ?? []
    }

    const selectedFlavor = flavors?.find((f) => f.id === selectedFlavorId)

    return (
        <main className="min-h-screen bg-gray-50 px-8 py-8 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">Prompt Chain Tool</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Signed in as: {user?.email}
                        </p>
                    </div>
                    <ThemeModeControl />
                </header>

                {flavorsError && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950 dark:text-red-200">
                        Failed to load humor flavors: {flavorsError.message}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
                        <h2 className="text-lg font-semibold">Humor Flavors</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Select a flavor to view and edit its prompt chain steps.
                        </p>

                        <form
                            action="/api/flavors/create"
                            method="POST"
                            className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950"
                        >
                            <h3 className="text-sm font-semibold">Create New Flavor</h3>

                            <input
                                name="description"
                                placeholder="Flavor description"
                                required
                                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                            />

                            <input
                                name="slug"
                                placeholder="slug optional"
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                            />

                            <button
                                type="submit"
                                className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-300"
                            >
                                + Create Flavor
                            </button>
                        </form>

                        <div className="mt-5 space-y-3">
                            {(flavors as HumorFlavor[] | null)?.map((flavor) => (
                                <div
                                    key={flavor.id}
                                    className={`rounded-xl border p-4 transition ${
                                        selectedFlavorId === flavor.id
                                            ? "border-black bg-gray-100 dark:border-gray-300 dark:bg-gray-800"
                                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <a href={`/?flavorId=${flavor.id}`} className="block">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium">
                                                {flavor.description || "Untitled flavor"}
                                            </p>
                                            {flavor.is_pinned && (
                                                <span className="rounded-full bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-100 dark:text-gray-950">
                                                    pinned
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            #{flavor.id} · {flavor.slug || "no-slug"}
                                        </p>
                                    </a>

                                    {selectedFlavorId === flavor.id && (
                                        <div className="mt-4 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                                            <form
                                                action="/api/flavors/update"
                                                method="POST"
                                                className="space-y-2"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="flavorId"
                                                    value={flavor.id}
                                                />

                                                <input
                                                    name="description"
                                                    defaultValue={flavor.description ?? ""}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                                />

                                                <input
                                                    name="slug"
                                                    defaultValue={flavor.slug ?? ""}
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                                />

                                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        name="isPinned"
                                                        defaultChecked={flavor.is_pinned ?? false}
                                                    />
                                                    Pinned
                                                </label>

                                                <button
                                                    type="submit"
                                                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                                >
                                                    Save Flavor
                                                </button>
                                            </form>

                                            <form
                                                action="/api/flavors/duplicate"
                                                method="POST"
                                                className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="flavorId"
                                                    value={flavor.id}
                                                />

                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    Duplicate with new name
                                                </label>

                                                <input
                                                    name="newDescription"
                                                    defaultValue={`${flavor.description || "Untitled flavor"} Copy`}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                                                />

                                                <button
                                                    type="submit"
                                                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                                >
                                                    Duplicate Flavor
                                                </button>
                                            </form>

                                            <form action="/api/flavors/delete" method="POST">
                                                <input
                                                    type="hidden"
                                                    name="flavorId"
                                                    value={flavor.id}
                                                />
                                                <ConfirmSubmitButton
                                                    message={`Delete "${flavor.description || "Untitled flavor"}" and all of its steps?`}
                                                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                                                >
                                                    Delete Flavor
                                                </ConfirmSubmitButton>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
                        <div className="mb-5">
                            <h2 className="text-lg font-semibold">
                                {selectedFlavor
                                    ? selectedFlavor.description || "Untitled flavor"
                                    : "No flavor selected"}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {selectedFlavor
                                    ? `Flavor ID: ${selectedFlavor.id}`
                                    : "Choose a flavor from the left side."}
                            </p>
                        </div>

                        {selectedFlavorId ? (
                            <div className="space-y-4">
                                <TestFlavorForm flavorId={selectedFlavorId} />
                                <form action="/api/steps/create" method="POST" className="mb-4">
                                    <input
                                        type="hidden"
                                        name="flavorId"
                                        value={selectedFlavorId}
                                    />
                                    <button className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-300">
                                        + Add Step
                                    </button>
                                </form>

                                {steps.length === 0 && (
                                    <p className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        No steps found for this humor flavor.
                                    </p>
                                )}

                                {steps.map((step) => (
                                    <article
                                        key={step.id}
                                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold">
                                                    Step {step.order_by ?? "?"}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Step ID: {step.id}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <form action="/api/steps/move-up" method="POST">
                                                    <input type="hidden" name="stepId" value={step.id} />
                                                    <input type="hidden" name="flavorId" value={selectedFlavorId} />
                                                    <button
                                                        type="submit"
                                                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                                    >
                                                        ↑ Move up
                                                    </button>
                                                </form>

                                                <form action="/api/steps/move-down" method="POST">
                                                    <input type="hidden" name="stepId" value={step.id} />
                                                    <input type="hidden" name="flavorId" value={selectedFlavorId} />
                                                    <button
                                                        type="submit"
                                                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                                    >
                                                        ↓ Move down
                                                    </button>
                                                </form>

                                                <form action="/api/steps/delete" method="POST">
                                                    <input type="hidden" name="stepId" value={step.id} />
                                                    <input type="hidden" name="flavorId" value={selectedFlavorId} />
                                                    <ConfirmSubmitButton
                                                        message={`Delete step ${step.order_by ?? step.id}?`}
                                                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                                                    >
                                                        Delete Step
                                                    </ConfirmSubmitButton>
                                                </form>
                                            </div>
                                        </div>

                                        <form
                                            action="/api/steps/update"
                                            method="POST"
                                            className="mt-4 space-y-4"
                                        >
                                            <input type="hidden" name="stepId" value={step.id} />
                                            <input type="hidden" name="flavorId" value={selectedFlavorId} />

                                            <div className="grid gap-3 text-sm md:grid-cols-5">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        Temperature
                                                    </label>
                                                    <input
                                                        name="llmTemperature"
                                                        type="number"
                                                        step="0.1"
                                                        defaultValue={step.llm_temperature ?? 0.7}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        Model ID
                                                    </label>
                                                    <input
                                                        name="llmModelId"
                                                        type="number"
                                                        defaultValue={step.llm_model_id ?? 1}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        Input Type ID
                                                    </label>
                                                    <input
                                                        name="llmInputTypeId"
                                                        type="number"
                                                        defaultValue={step.llm_input_type_id ?? 1}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        Output Type ID
                                                    </label>
                                                    <input
                                                        name="llmOutputTypeId"
                                                        type="number"
                                                        defaultValue={step.llm_output_type_id ?? 1}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        Step Type ID
                                                    </label>
                                                    <input
                                                        name="humorFlavorStepTypeId"
                                                        type="number"
                                                        defaultValue={step.humor_flavor_step_type_id ?? 1}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">
                                                    Description
                                                </label>
                                                <input
                                                    name="description"
                                                    defaultValue={step.description ?? ""}
                                                    placeholder="Optional description"
                                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                                                />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        System Prompt
                                                    </label>
                                                    <textarea
                                                        name="llmSystemPrompt"
                                                        defaultValue={step.llm_system_prompt ?? ""}
                                                        rows={8}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        User Prompt
                                                    </label>
                                                    <textarea
                                                        name="llmUserPrompt"
                                                        defaultValue={step.llm_user_prompt ?? ""}
                                                        rows={8}
                                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-950"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-300"
                                                >
                                                    Save Step
                                                </button>
                                            </div>
                                        </form>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                Select a humor flavor to inspect its ordered steps.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    )
}
