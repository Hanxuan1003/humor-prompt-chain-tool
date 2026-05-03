import LoginButton from "./login-button"

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Prompt Chain Tool
                </h1>

                <p className="mt-3 text-sm text-gray-600">
                    Sign in to manage humor prompt chains and caption generation tools.
                </p>

                <div className="mt-6">
                    <LoginButton />
                </div>
            </div>
        </main>
    )
}