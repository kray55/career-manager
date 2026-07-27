"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  priceId: string;
  unitAmount: number;
  currency: string;
}

interface Props {
  products: Product[];
}

export default function StoreClient({ products }: Props) {
  const { data: session } = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBuy = async (product: Product) => {
    if (!session) {
      toast.error("Please sign in to purchase");
      return;
    }
    setLoadingId(product.id);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: [{ price: product.priceId, quantity: 1 }],
          successUrl: `${window.location.origin}/store?success=true`,
          cancelUrl: `${window.location.origin}/store?canceled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="  24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4  00-8 v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-white font-semibold">Career Store</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</a>
              <a href="/library" className="text-sm text-slate-300 hover:text-white">Library</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Career Resources Store</h1>
          <p className="text-slate-400 mt-1">Premium templates, tools, and coaching packages to accelerate your career.</p>
        </div>

        {products.length < 1 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" viewBox="  24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 l-8 4m8-4v10l-8 4m-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-slate-500 text-lg">No products available yet.</p>
            <p className="text-slate-600 text-sm mt-1">Check back soon for new career resources.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
                isLoading={loadingId === product.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
