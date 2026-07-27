"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

/**
 * T9-B: ChatWidget - Floating chat button (fixed bottom-4 right-4)
 * Expands into a chat modal. Connects to Socket.io via /api/socket.
 */
export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubject, setNotifySubject] = useState("");
  const [showNotify, setShowNotify] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  const tenantId = user?.tenantId;
  const userId = user?.id;
  const userName = user?.name || "User";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!tenantId || !userId) return;
    const s = io({
      path: "/api/socket",
      query: { tenantId, userId, userName },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => { setIsConnected(true); s.emit("chat:history"); });
    s.on("disconnect", () => setIsConnected(false));
    s.on("chat:history", (data: ChatMessage[]) => setMessages(data || []));
    s.on("chat:message", (data: ChatMessage) => setMessages((prev) => [...prev, data]));
    s.on("chat:error", (data: any) => toast.error(data?.message || "Chat error"));
    s.on("chat:notify:result", (data: any) => {
      if (data.success) { toast.success("Notification sent!"); setShowNotify(false); setNotifyEmail(""); setNotifySubject(""); }
      else toast.error(data?.error || "Failed to send");
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [tenantId, userId, userName]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socket) return;
    socket.emit("chat:message", { content: input.trim() });
    setInput("");
    inputRef.current?.focus();
  }, [input, socket]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleNotify = () => {
    if (!notifyEmail.trim() || !socket) return;
    const recent = messages.slice(-5).map((m) => `${m.senderName}: ${m.content}`).join("\n");
    socket.emit("chat:notify", {
      to: notifyEmail.trim(),
      subject: notifySubject.trim() || "Chat Notification",
      body: `Recent messages:\n\n${recent}`,
    });
  };

  if (!session) return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-xl transition-all ${
          isOpen ? "bg-red-500 rotate-45" : "bg-gradient-to-r from-primary-500 to-primary-700"
        }`} title={isOpen ? "Close" : "Chat"}>
        <svg className="w-6 h-6 text-white mx-auto" fill="none" viewBox="  24 24" stroke="currentColor">
          {isOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2  00-2 2v3l4-1.5V17h2a2 2  012 2v3l4-1.5V19a2 2  00-2-2h-2a2 2  01-2-2V8h12V5a2 2  00-2-2H7a2 2  00-2 2v8h12" />
          }
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] h-[520px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              <h3 className="text-white font-semibold text-sm">Team Chat</h3>
              <span className="text-xs text-slate-500">({messages.length})</span>
            </div>
            <button onClick={() => setShowNotify(!showNotify)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 text-xs" title="Notify">
              <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2  014.22 l7.89-5.26M5 19h14a2 2  002-2V7a2 2  00-2-2H5a2 2  00-2 2v10a2 2  002 2z" /></svg>
            </button>
          </div>

          {showNotify && (
            <div className="px-4 py-3 border-b border-white/10 bg-slate-800/30 space-y-2">
              <input type="email" placeholder="Recipient email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50" />
              <input type="text" placeholder="Subject (optional)" value={notifySubject} onChange={e => setNotifySubject(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50" />
              <button onClick={handleNotify} disabled={!notifyEmail.trim()}
                className="w-full py-1.5 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30 disabled:opacity-50">
                Send Notification
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No messages yet</p>
                <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.senderId === userId
                    ? "bg-primary-600/20 text-primary-200 border border-primary-500/20"
                    : "bg-slate-800/50 text-slate-200 border border-white/5"
                }`}>
                  <div className="flex items-center gap-2 mb-.5">
                    <span className="text-xs font-medium opacity-70">{msg.senderId === userId ? "You" : msg.senderName}</span>
                    <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type a message..." disabled={!isConnected}
                className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50 disabled:opacity-50" />
              <button onClick={sendMessage} disabled={!input.trim() || !isConnected}
                className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-xl hover:bg-primary-500/30 border border-primary-500/30 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m 7 7l-7-7m-7 7l7-7" /></svg>
              </button>
            </div>
            {!isConnected && <p className="text-xs text-red-400 mt-1">Disconnected...</p>}
          </div>
        </div>
      )}
    </>
  );
}
