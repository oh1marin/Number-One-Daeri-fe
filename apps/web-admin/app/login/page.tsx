"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isAdminSignupDisabled } from "@/lib/adminEnv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error ?? "로그인에 실패했습니다.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#f0f2f7 0%,#e8eaf6 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg text-white font-bold text-xl"
            style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
          >
            R
          </div>
          <h1 className="text-2xl font-bold text-gray-900">일등대리 관리자</h1>
          <p className="text-sm text-gray-500 mt-1">관리자 계정으로 로그인하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          {!isAdminSignupDisabled() && (
            <p className="mt-6 text-center text-sm text-gray-500">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
                회원가입
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
