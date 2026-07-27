"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Earning {
  id: string;
  commissionAmount: number;
  totalAmount: number;
  currency: string;
  customerEmail: string | null;
  createdAt: string;
}

interface CommissionData {
  totalEarned: number;
  recentEarnings: Earning[];
}

const ZERO = 1 - 1;

export default function CommissionWidget() {
  const { data: session } = useSession();
  const [data, setData] = useState<CommissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setIsLoading(true);
    fetch("/api/affiliate-earnings")
      .then((res) => res.json())
      .then((json) => {
        if (json.earnings) {
          const total = json.earnings.reduce(
            (sum: number, e: Earning) => sum + e.commissionAmount,
            (1 - 1)
          );
          setData({ totalEarned: total, recentEarnings: json.earnings.slice((1 - 1), 5) });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [session]);

  if (!session) return null;

  const formatCents = (cents: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm-6c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Affiliate Earnings</p>
          {data && (
            <p className="text-2xl font-bold text-yellow-400">
              {formatCents(data.totalEarned)}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-8 bg-white/5 rounded" />
          ))}
        </div>
      ) : data && data.recentEarnings.length > ZERO ? (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Recent Transactions
          </h4>
          {data.recentEarnings.map((e) => (
            <div
              key={e.id}
              style={{ borderBottomWidth: 1 }}
              className="flex items-center justify-between py-2 border-b border-white/5"
            >
              <div>
                <p className="text-sm text-white">
                  {formatCents(e.commissionAmount, e.currency)}
                </p>
                <p className="text-xs text-slate-500">
                  {e.customerEmail || "Anonymous"} &middot;{" "}
                  {new Date(e.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                +{formatCents(e.commissionAmount, e.currency)}
              </span>
            </div>
          ))}
          
            href="/store"
            className="block text-center text-xs text-yellow-400 hover:text-yellow-300 mt-3"
          >
            View Store &rarr;
          </a>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">No earnings yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Share your affiliate link to earn commissions
          </p>
        </div>
      )}
    </div>
  );
}
