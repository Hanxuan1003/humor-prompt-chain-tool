"use client"

import { useState } from "react"

type TestFlavorFormProps = {
    flavorId: number
}

export default function TestFlavorForm({ flavorId }: TestFlavorFormProps) {
    const [loading, setLoading] = useState(false)
    const [captions, setCaptions] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = event.currentTarget
        const formData = new FormData(form)

        setLoading(true)
        setError(null)
        setCaptions([])

        try {
            const response = await fetch("/api/test-flavor", {
                method: "POST",
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                const detail =
                    typeof result.detail === "string"
                        ? result.detail
                        : result.detail
                            ? JSON.stringify(result.detail)
                            : ""

                throw new Error(
                    detail
                        ? `${result.error || "Failed to generate captions"}: ${detail}`
                        : result.error || "Failed to generate captions"
                )
            }

            setCaptions(result.captions ?? [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950">
            <h3 className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                Test This Humor Flavor
            </h3>

            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                Upload an image and generate captions using this selected humor flavor.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <input type="hidden" name="flavorId" value={flavorId} />

                <input
                    name="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                    required
                    className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm dark:border-blue-900 dark:bg-gray-950"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                    {loading ? "Generating..." : "Generate Captions"}
                </button>
            </form>

            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                    {error}
                </div>
            )}

            {captions.length > 0 && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-900 dark:bg-gray-950">
                    <h4 className="text-sm font-semibold">Generated Captions</h4>

                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                        {captions.map((caption, index) => (
                            <li key={index}>{caption}</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    )
}
