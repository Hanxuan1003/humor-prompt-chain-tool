import { requireAdminForJson } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

const API_BASE_URL = "https://api.almostcrackd.ai"

function extractCaptions(data: unknown): string[] {
    if (Array.isArray(data)) {
        return data.map((entry) => {
            if (typeof entry === "string") return entry

            if (entry && typeof entry === "object") {
                const record = entry as Record<string, unknown>
                return String(
                    record.content ??
                    record.caption ??
                    record.text ??
                    JSON.stringify(record)
                )
            }

            return String(entry)
        })
    }

    if (!data || typeof data !== "object") return []

    const obj = data as Record<string, unknown>

    const possibleArrays = [
        obj.captions,
        obj.data,
        obj.results,
        obj.captionRecords,
    ]

    for (const item of possibleArrays) {
        if (Array.isArray(item)) {
            return item.map((entry) => {
                if (typeof entry === "string") return entry

                if (entry && typeof entry === "object") {
                    const record = entry as Record<string, unknown>
                    return String(
                        record.content ??
                        record.caption ??
                        record.text ??
                        JSON.stringify(record)
                    )
                }

                return String(entry)
            })
        }
    }

    return [JSON.stringify(data, null, 2)]
}

export async function POST(request: Request) {
    const formData = await request.formData()

    const flavorId = Number(formData.get("flavorId"))
    const image = formData.get("image")

    if (!flavorId) {
        return NextResponse.json({ error: "Missing flavorId" }, { status: 400 })
    }

    if (!(image instanceof File)) {
        return NextResponse.json({ error: "Missing image file" }, { status: 400 })
    }

    const admin = await requireAdminForJson()

    if (admin.response) {
        return admin.response
    }

    const {
        data: { session },
    } = await admin.supabase.auth.getSession()

    const token = session?.access_token

    if (!token) {
        return NextResponse.json(
            { error: "Missing Supabase access token" },
            { status: 401 }
        )
    }

    const contentType = image.type || "image/jpeg"

    try {
        const presignResponse = await fetch(
            `${API_BASE_URL}/pipeline/generate-presigned-url`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contentType,
                }),
            }
        )

        const presignData = await presignResponse.json()

        if (!presignResponse.ok) {
            return NextResponse.json(
                {
                    error: "Failed to generate presigned URL",
                    detail: presignData,
                },
                { status: presignResponse.status }
            )
        }

        const presignedUrl = presignData.presignedUrl
        const cdnUrl = presignData.cdnUrl

        if (!presignedUrl || !cdnUrl) {
            return NextResponse.json(
                {
                    error: "Presign response missing presignedUrl or cdnUrl",
                    detail: presignData,
                },
                { status: 500 }
            )
        }

        const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": contentType,
            },
            body: image,
        })

        if (!uploadResponse.ok) {
            return NextResponse.json(
                {
                    error: "Failed to upload image bytes",
                    detail: await uploadResponse.text(),
                },
                { status: uploadResponse.status }
            )
        }

        const registerResponse = await fetch(
            `${API_BASE_URL}/pipeline/upload-image-from-url`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: cdnUrl,
                    isCommonUse: false,
                }),
            }
        )

        const registerData = await registerResponse.json()

        if (!registerResponse.ok) {
            return NextResponse.json(
                {
                    error: "Failed to register image URL",
                    detail: registerData,
                },
                { status: registerResponse.status }
            )
        }

        const imageId = registerData.imageId

        if (!imageId) {
            return NextResponse.json(
                {
                    error: "Register response missing imageId",
                    detail: registerData,
                },
                { status: 500 }
            )
        }

        const captionsResponse = await fetch(
            `${API_BASE_URL}/pipeline/generate-captions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageId,
                    humorFlavorId: flavorId,
                }),
            }
        )

        const captionsData = await captionsResponse.json()

        if (!captionsResponse.ok) {
            return NextResponse.json(
                {
                    error: "Failed to generate captions",
                    detail: captionsData,
                },
                { status: captionsResponse.status }
            )
        }

        return NextResponse.json({
            imageId,
            cdnUrl,
            captions: extractCaptions(captionsData),
            raw: captionsData,
        })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown server error",
            },
            { status: 500 }
        )
    }
}
