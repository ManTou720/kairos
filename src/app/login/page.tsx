"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/Logo";

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
    <div className="min-h-screen flex items-center justify-center bg-[#0D2275] px-4">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center mb-8">
            <Logo size={64} className="mx-auto mb-4" />
            <h1 className="font-display text-4xl font-bold text-[#0D2275] tracking-tight">
              Kairos
            </h1>
            <p className="mt-1 text-[#6A6963] text-sm">
              掌握時機，掌握語言
            </p>
          </div>

          <h2 className="font-display text-center text-[28px] font-bold text-[#0D2275] mb-1">
            歡迎來到 Kairos
          </h2>
          <p className="text-center text-sm text-[#4A5568] mb-6">
            輸入你的使用者名稱以開始學習
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                使用者名稱
              </label>
              <input
                id="username"
                type="text"
                autoFocus
                autoComplete="username"
                placeholder="輸入你的使用者名稱"
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
              className="w-full rounded-full bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#C9A02E] disabled:opacity-50 transition-colors"
            >
              {loading ? "登入中..." : "確認進入"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
