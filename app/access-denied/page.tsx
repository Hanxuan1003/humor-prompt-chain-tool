export default function AccessDeniedPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Access denied
                </h1>

                <p className="mt-3 text-sm text-gray-600">
                    You are signed in, but your account does not have permission to use
                    this prompt chain tool.
                </p>
            </div>
        </main>
    )
}