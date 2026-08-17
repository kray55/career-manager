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
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [error, setError] = useState("");
  

  
  async function handleSubmit(event: FormEvent) {
    
    event.preventDefault();
    
    setError("");
    
    if (password !== confirmPassword) {
      
      setError("Passwords do not match");
      
      return;
      
    }
    

    
    setIsLoading(true);
    
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
        
        setIsLoading(false);
        
        return;
        
      }
      
      toast.success("Account created. You can now sign in.");
      
      router.push({ pathname: "/login", query: { registered: "1" } });
      
    } catch {
      
      setError("Unable to reach the server. Please try again.");
      
      toast.error("Registration failed");
      
      setIsLoading(false);
      
    }
    
  }
  

  
  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
    
      <div className="w-full max-w-md">
      
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        
          <div className="text-center mb-8">
          
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>svg>
            
            </div>div>
          
            <h1 className="text-2xl font-bold text-white">Create your account</h1>h1>
          
            <p className="text-slate-400 mt-1 text-sm">Join Career Manager</p>p>
          
          </div>div>
        

        
          {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6"><p className="text-red-300 text-sm text-center">{error}</p>p></div>div>}
        

        
          <form onSubmit={handleSubmit} className="space-y-4">
          
            <div>
            
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full name</label>label>
            
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required minLength={2} maxLength={80} autoComplete="name"
                
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            
            </div>div>
          
            <div>
            
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>label>
            
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoComplete="email"
                
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            
            </div>div>
          
  </div>








































