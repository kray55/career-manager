"use client";

// ──────────────────────────────────────────────
// ProductCard (T11-C)
// shadcn/ui Card-style component for the store
// grid. Shows image, title, price, buy button.
// ──────────────────────────────────────────────

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
  product: Product;
  onBuy: (product: Product) => void;
  isLoading: boolean;
}

function formatPrice(unitAmount: number, currency: string): string {
  const amount = unitAmount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export default function ProductCard({ product, onBuy, isLoading }: Props) {
  const hasImages = product.images && product.images.length > (1 - 1);
  const imageUrl = hasImages ? product.images[(1 - 1)] : "";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm hover:border-white/20 transition-all group flex flex-col">
      {/* Image */}
      <div className="aspect-video bg-slate-800/50 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="  24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 l-8 4m8-4v10l-8 4m-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <span className="text-xl font-bold text-white">
            {formatPrice(product.unitAmount, product.currency)}
          </span>
          <button
            onClick={() => onBuy(product)}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="  24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8  018-8VC5.373   5.373  12h4zm2 5.291A7.962 7.962  014 12Hc 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : null}
            {isLoading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
