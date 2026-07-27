"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email, password,
        totpCode: mfaRequired ? totpCode : "",
        redirect: false,
        callbackUrl: (callbackUrl as string) || "/dashboard",
      });

      if (result?.error) { setError("Invalid credentials"); toast.error("Invalid credentials"); setIsLoading(false); return; }

      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (session?.user?.mfaRequired) {
          setMfaRequired(true);
          toast("Enter your 2FA code", { icon: "🔐" });
          setIsLoading(false);
          return;
        }
        toast.success("Welcome back!");
        router.push((callbackUrl as string) || "/dashboard");
      }
    } catch { setError("An error occurred"); toast.error("Login failed"); setIsLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Career Manager</h1>
            <p className="text-slate-400 mt-1 text-sm">{mfaRequired ? "Enter your 2FA code" : "Sign in to your account"}</p>
          </div>

          {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6"><p className="text-red-300 text-sm text-center">{error}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!mfaRequired ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="totpCode" className="block text-sm font-medium text-slate-300 mb-1">Authenticator Code</label>
                <input id="totpCode" type="text" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" inputMode="numeric" required maxLength={6}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <p className="text-slate-500 text-xs mt-2 text-center">Enter the 6-digit code from your authenticator app</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium rounded-lg shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              ) : mfaRequired ? "Verify Code" : "Sign In"}
            </button>
          </form>
          <p className="text-center mt-8 text-xs text-slate-500">Career Manager Portal &mdash; Enterprise Edition</p>
        </div>
      </div>
    </div>
  );
}
