"use client"

import { useEffect, useState } from "react"

type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "prompt-chain-theme-mode"

function applyTheme(mode: ThemeMode) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = mode === "dark" || (mode === "system" && prefersDark)

    document.documentElement.classList.toggle("dark", shouldUseDark)
    document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light"
}

export default function ThemeModeControl() {
    const [mode, setMode] = useState<ThemeMode>(() => {
        if (typeof window === "undefined") {
            return "system"
        }

        const savedMode = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null

        return savedMode === "light" || savedMode === "dark" || savedMode === "system"
            ? savedMode
            : "system"
    })

    useEffect(() => {
        applyTheme(mode)

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleSystemChange = () => {
            if (mode === "system") {
                applyTheme("system")
            }
        }

        mediaQuery.addEventListener("change", handleSystemChange)

        return () => mediaQuery.removeEventListener("change", handleSystemChange)
    }, [mode])

    function chooseMode(nextMode: ThemeMode) {
        setMode(nextMode)
        window.localStorage.setItem(STORAGE_KEY, nextMode)
        applyTheme(nextMode)
    }

    return (
        <div
            aria-label="Theme mode"
            className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
            {(["light", "dark", "system"] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => chooseMode(option)}
                    className={`rounded-md px-3 py-1.5 font-medium capitalize transition ${
                        mode === option
                            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-950"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    )
}
