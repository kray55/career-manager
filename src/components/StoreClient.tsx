import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

interface Product { id: string; name: string; description: string | null; images: string[]; priceId: string; unitAmount: number; currency: string }
interface Props { products: Product[] }
interface CartLine { product: Product; quantity: number }

function formatPrice(unitAmount: number, currency: string) { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(unitAmount / 100); }

export default function StoreClient({ products }: Props) {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.unitAmount * line.quantity, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => setCart((current) => current.flatMap((line) => line.product.id === id ? (line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : []) : [line]));

  const checkout = async () => {
    if (!session) { toast.error("Please sign in to purchase"); return; }
    if (!cart.length) { toast.error("Your cart is empty"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lineItems: cart.map((line) => ({ price: line.product.priceId, quantity: line.quantity })), successUrl: `${window.location.origin}/store?success=true`, cancelUrl: `${window.location.origin}/store?canceled=true` }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else toast.error(data.error || "Checkout failed");
    } catch { toast.error("Secure checkout is temporarily unavailable"); } finally { setLoading(false); }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 text-white">✦</div><span className="font-semibold text-white">Career Store</span></div><div className="flex items-center gap-3"><a href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</a><a href="/library" className="text-sm text-slate-300 hover:text-white">Library</a><button onClick={() => setShowCart(true)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">Cart ({cartCount})</button></div></div></nav>
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-10 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">Career resources</p><h1 className="mt-3 text-3xl font-bold text-white">Tools that make your next move easier.</h1><p className="mt-3 text-slate-400">Explore practical templates, coaching resources, and professional tools. Review the product map and unique selling points before adding anything to your cart.</p></div>{products.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} onDetails={setSelected} onAddToCart={addToCart} />)}</div> : <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center text-slate-400">No products are available yet.</div>}</main>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary-300">Product map</p><h2 className="mt-2 text-2xl font-bold text-white">{selected.name}</h2></div><button onClick={() => setSelected(null)} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/5 p-4"><h3 className="font-semibold text-white">What you receive</h3><p className="mt-2 text-sm leading-6 text-slate-400">{selected.description || "A focused resource built for career clarity and momentum."}</p></div><div className="rounded-xl border border-primary-400/20 bg-primary-500/10 p-4"><h3 className="font-semibold text-white">Why it is useful</h3><p className="mt-2 text-sm leading-6 text-slate-300">Save time, present your experience clearly, and move from preparation to action with a reusable professional asset.</p></div></div><div className="mt-6 flex items-center justify-between"><span className="text-xl font-bold text-white">{formatPrice(selected.unitAmount, selected.currency)}</span><button onClick={() => { addToCart(selected); setSelected(null); }} className="rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white">Add to cart</button></div></div></div>}

    {showCart && <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"><aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Your cart</h2><button onClick={() => setShowCart(false)} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 flex-1 space-y-4 overflow-y-auto">{cart.length ? cart.map((line) => <div key={line.product.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex justify-between gap-3"><span className="font-medium text-white">{line.product.name}</span><span className="text-sm text-slate-300">{formatPrice(line.product.unitAmount * line.quantity, line.product.currency)}</span></div><div className="mt-3 flex items-center gap-3 text-sm"><button onClick={() => updateQuantity(line.product.id, -1)} className="rounded-lg border border-white/15 px-2 text-white">−</button><span className="text-slate-300">{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, 1)} className="rounded-lg border border-white/15 px-2 text-white">+</button></div></div>) : <p className="text-sm text-slate-400">Your cart is ready for your next career investment.</p>}</div><div className="border-t border-white/10 pt-5"><div className="flex justify-between text-lg font-semibold text-white"><span>Total</span><span>{formatPrice(total, cart[0]?.product.currency || "usd")}</span></div><button disabled={loading || !cart.length} onClick={checkout} className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Opening secure checkout..." : "Checkout securely with Stripe"}</button><p className="mt-3 text-center text-xs leading-5 text-slate-500">Stripe card checkout is active. PayPal and direct bank transfer can be enabled when their merchant credentials and reconciliation workflow are configured.</p></div></aside></div>}
  </div>;
}
