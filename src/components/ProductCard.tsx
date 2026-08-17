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
  onDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(unitAmount / 100);
}

export default function ProductCard({ product, onDetails, onAddToCart }: Props) {
  const imageUrl = product.images?.[0];
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary-400/40 hover:shadow-2xl">
      <button type="button" onClick={() => onDetails(product)} className="group relative aspect-[16/10] overflow-hidden bg-slate-800/70 text-left">
        {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-5xl text-primary-300">✦</div>}
        <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-xs text-white">View product details</span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{product.description || "A practical career resource designed to help you move forward with confidence."}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="text-xl font-bold text-white">{formatPrice(product.unitAmount, product.currency)}</span>
          <button type="button" onClick={() => onAddToCart(product)} className="rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-primary-400 hover:to-indigo-500">Add to cart</button>
        </div>
      </div>
    </article>
  );
}
