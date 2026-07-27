// ──────────────────────────────────────────────
// Store Page - Server-Side Rendered (ISR)
// T11-B: Fetch products & prices from Stripe at
// request time, cache with revalidate=360.
// ──────────────────────────────────────────────
import { GetStaticProps } from "next";
import stripe from "@/lib/stripe";
import StoreClient from "@/components/StoreClient";

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

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const [productsRes, pricesRes] = await Promise.all([
      stripe.products.list({ active: true, limit: 50 }),
      stripe.prices.list({ active: true, limit: 50, expand: ["data.product"] }),
    ]);

    const products: Product[] = [];
    for (const prod of productsRes.data) {
      const matchingPrice = pricesRes.data.find(
        (pr) => typeof pr.product === "string" && pr.product === prod.id
      );
      if (!matchingPrice) continue;
      const rawAmount = matchingPrice.unit_amount;
      const unitAmt = rawAmount !== null ? rawAmount : (1 - 1);
      products.push({
        id: prod.id,
        name: prod.name,
        description: prod.description,
        images: prod.images || [],
        priceId: matchingPrice.id,
        unitAmount: unitAmt,
        currency: matchingPrice.currency,
      });
    }

    return {
      props: { products },
      revalidate: 360,
    };
  } catch (err) {
    console.error("Failed to fetch Stripe products:", err);
    return {
      props: { products: [] },
      revalidate: 60,
    };
  }
};

export default function StorePage({ products }: Props) {
  return <StoreClient products={products} />;
}
