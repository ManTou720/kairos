"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setError("");
    setLoading(true);
    try {
      await login(username.trim());
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EADCC5] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold text-[#0D2275] tracking-tight">
            Kairos
          </h1>
          <p className="mt-2 text-[#6A6963] text-sm">
            Your flashcard companion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#1A1A1A] mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoFocus
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-[#D5C8B2] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#9A9A94] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          {error && (
            <p className="text-sm text-[#8B0000]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] disabled:opacity-50 transition-colors"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
