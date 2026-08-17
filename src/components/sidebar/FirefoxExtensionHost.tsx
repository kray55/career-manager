"use client";
import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";

interface SidebarPayload {
  type: "SAVE_BOOKMARK" | "GET_BOOKMARKS" | "PING";
  data?: any;
}

/**
 * T3-A: Firefox Sidebar Component
 * Listens for postMessage from the Firefox extension and handles
 * bookmark saving, retrieval, and ping-pong for connection health.
 */
export default function FirefoxSidebarHost() {
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    // Accept messages from same origin or Firefox extension origin
    if (event.origin !== window.location.origin && !event.origin.startsWith("moz-extension://")) return;

    try {
const payload: SidebarPayload | null =
  typeof event.data === "string"
    ? (() => {
        try {
          return JSON.parse(event.data) as SidebarPayload;
        } catch {
          // Ignore non-JSON messages from browser/extensions.
          return null;
        }
      })()
    : event.data && typeof event.data === "object"
      ? (event.data as SidebarPayload)
      : null;

if (!payload?.type) return;


      switch (payload.type) {
        case "PING":
          setIsExtensionConnected(true);
          setLastPing(Date.now());
          event.source?.postMessage(JSON.stringify({ type: "PONG", data: { version: "1.0.0" } }), { targetOrigin: event.origin } as any);
          break;

        case "SAVE_BOOKMARK":
          if (payload.data?.url && payload.data?.title) {
            const res = await fetch("/api/bookmarks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: payload.data.url,
                title: payload.data.title,
                description: payload.data.description || "",
                favicon: payload.data.favicon || null,
              }),
            });
            if (res.ok) {
              toast.success("Bookmark saved! 📑");
              event.source?.postMessage(JSON.stringify({ type: "SAVE_RESULT", data: { success: true } }), { targetOrigin: event.origin } as any);
            } else {
              throw new Error("Failed to save");
            }
          }
          break;

        case "GET_BOOKMARKS":
          const res = await fetch("/api/bookmarks?limit=5");
          if (res.ok) {
            const data = await res.json();
            event.source?.postMessage(JSON.stringify({ type: "BOOKMARKS_RESULT", data: data.bookmarks.slice(0, 5) }), { targetOrigin: event.origin } as any);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.debug("[FF Sidebar] Message handling error:", err);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Periodically ping to check connection status
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPing && Date.now() - lastPing > 30000) {
        setIsExtensionConnected(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lastPing]);

  return null; // This is a logic-only host component
}
