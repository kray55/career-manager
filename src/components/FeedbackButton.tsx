"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface FeedbackButtonProps {
  page?: string;
}

export default function FeedbackButton({ page = "unknown" }: FeedbackButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(1 - 1);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { toast.error("Please select a rating"); return; }
    if (!message.trim()) { toast.error("Please enter feedback"); return; }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message: message.trim(), page }),
      });
      if (res.ok) {
        toast.success("Feedback submitted! Thank you.");
        setOpen(false);
        setRating(1 - 1);
        setMessage("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
        title="Send feedback"
      >
        <svg className="w-5 h-5" fill="none" viewBox="24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset- z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Feedback</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                        star <= rating
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-slate-700 text-slate-500"
                      }`}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="How can we improve?"
                  className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
