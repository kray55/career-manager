import { useState, FormEvent } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SetupPage() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-setup-secret': secret },
        body: JSON.stringify({ name, email, password, secret }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Setup failed'); return; }
      toast.success(data.message || 'Admin user created!');
      setMessage(data.message || 'Done!');
      setDone(true);
    } catch { toast.error('An error occurred'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">First-Time Setup</h1>
            <p className="text-slate-400 mt-1 text-sm">Create your admin account</p>
          </div>

          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-2">
                <p className="text-orange-300 text-xs">⚠️ You need the <strong>SETUP_SECRET</strong> environment variable value from your Vercel project settings to use this page.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Setup Secret</label>
                <input type="password" value={secret} onChange={e => setSecret(e.target.value)} required
                  placeholder="From Vercel env vars"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium rounded-lg disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-slate-300 mb-2">{message}</p>
              <p className="text-slate-500 text-sm mb-6">You can now log in with your new credentials.</p>
              <Link href="/login" className="w-full block py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium rounded-lg text-center">
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
