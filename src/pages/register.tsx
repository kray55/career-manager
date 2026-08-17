import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to create your account");
        toast.error(payload.error || "Registration failed");
        setLoading(false);
        return;
      }
      toast.success("Account created");
      router.push({ pathname: "/login", query: { registered: "1" } });
    } catch {
      setError("Unable to reach the server. Please try again.");
      toast.error("Registration failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-white">Create your account</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-400">Join Career Manager</p>
        {error && <p className="mb-4 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-300">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full rounded-lg bg-white/10 p-3 text-white" type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
          <input className="w-full rounded-lg bg-white/10 p-3 text-white" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input className="w-full rounded-lg bg-white/10 p-3 text-white" type="password" placeholder="Password (at least 8 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
          <input className="w-full rounded-lg bg-white/10 p-3 text-white" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
          <button className="w-full rounded-lg bg-primary-600 p-3 font-medium text-white disabled:opacity-50" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link href="/login" className="text-primary-400">Sign in</Link></p>
      </section>
    </main>
  );
}
