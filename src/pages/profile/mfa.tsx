"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function MFAEnrollmentPage() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "scan" | "verify">("intro");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const handleStart = useCallback(async () => {
    setIsEnrolling(true);
    try {
      const res = await fetch("/api/auth/totp/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep("scan");
      toast.success("Scan the QR code with your authenticator app");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsEnrolling(false); }
  }, []);

  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) { toast.error("Enter a 6-digit code"); return; }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      await updateSession({ totpEnabled: true, mfaVerified: true } as any);
      toast.success("Two-factor authentication enabled! 🎉");
      setStep("intro");
      setVerificationCode("");
      setSecret("");
      setQrCode("");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsVerifying(false); }
  }, [verificationCode, secret, updateSession]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" /></div>;

  const isMfaEnabled = (session?.user as any)?.totpEnabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-lg mx-auto pt-20 px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className={`mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg ${isMfaEnabled ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-primary-400 to-primary-600"}`}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMfaEnabled ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{isMfaEnabled ? "Two-Factor Authentication" : "Enable Two-Factor Authentication"}</h1>
            <p className="text-slate-400 mt-1 text-sm">{isMfaEnabled ? "Your account is protected with 2FA." : "Add an extra layer of security."}</p>
          </div>

          {isMfaEnabled ? (
            <div className="text-center">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6"><p className="text-green-300 text-sm">✓ Two-factor authentication is active.</p></div>
              <button onClick={() => router.push("/dashboard")} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg">Back to Dashboard</button>
            </div>
          ) : step === "intro" ? (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">How it works:</h3>
                <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Click "Start Setup" to generate a secret key</li>
                  <li>Scan the QR code with Google Authenticator or Authy</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                </ol>
              </div>
              <button onClick={handleStart} disabled={isEnrolling}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center">
                {isEnrolling ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : "Start Setup"}
              </button>
              <button onClick={() => router.push("/dashboard")} className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg">Skip for now</button>
            </div>
          ) : step === "scan" ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 flex justify-center">{qrCode && <img src={qrCode} alt="TOTP QR Code" width={220} height={220} className="rounded-lg" />}</div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 text-xs mb-2">Or enter this key manually:</p>
                <div className="bg-slate-900 rounded px-3 py-2 font-mono text-sm text-primary-300 text-center tracking-wider select-all">{secret.match(/.{1,4}/g)?.join(" ") || secret}</div>
              </div>
              <button onClick={() => setStep("verify")} className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium rounded-lg shadow-lg">I've scanned the code</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <label htmlFor="verifyCode" className="block text-sm font-medium text-slate-300 mb-2">Enter the 6-digit code from your authenticator app</label>
                <input id="verifyCode" type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" inputMode="numeric" maxLength={6}
                  className="w-48 mx-auto px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center">
                {isVerifying ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : "Verify & Enable 2FA"}
              </button>
              <button onClick={() => setStep("scan")} className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg">Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
