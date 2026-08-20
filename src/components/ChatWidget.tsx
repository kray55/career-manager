"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface ChatRoom {
  id: string;
  name: string;
  type: "PRIVATE" | "INVITE_ONLY";
  description?: string;
  _count?: { members: number; messages: number };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

const USER_AVATARS = [
  "👤", "💼", "🎓", "🧭", "🚀", "🧠", "🛠️", "🌟",
  "👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "👩‍💻", "👨‍💻",
  "🧑‍🚀", "👩‍🔬", "👨‍🔬", "🧑‍🏫", "👩‍⚕️", "👨‍⚕️", "🧑‍⚖️", "🧑‍🎨",
  "👩‍🍳", "👨‍🍳", "🧑‍🤝‍🧑", "👥"
];
const GUEST_AVATARS = ["👋", "🤝", "🗣️", "💬", "🌐", "🙋", "🎙️", "🧑‍💻"];

function avatarIndex(value: string, size: number) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % size;
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"polling" | "disconnected">("disconnected");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubject, setNotifySubject] = useState("");
  const [showNotify, setShowNotify] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubject, setInviteSubject] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarEmoji, setAvatarEmoji] = useState(USER_AVATARS[0]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>();
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<"PRIVATE" | "INVITE_ONLY">("PRIVATE");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  const tenantId = user?.tenantId;
  const userId = user?.id;
  const userName = user?.name || "User";

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const savedAvatar = window.localStorage.getItem(`career-manager-avatar:${userId}`);
    if (savedAvatar && USER_AVATARS.includes(savedAvatar)) setAvatarEmoji(savedAvatar);
  }, [userId]);

  const chooseAvatar = (emoji: string) => {
    setAvatarEmoji(emoji);
    if (userId && typeof window !== "undefined") window.localStorage.setItem(`career-manager-avatar:${userId}`, emoji);
    setShowAvatarPicker(false);
  };

  const getMessageAvatar = (message: ChatMessage) => {
    if (message.senderId === userId) return avatarEmoji;
    const isGuest = message.senderName.toLowerCase().includes("guest") || message.senderId.toLowerCase().startsWith("guest");
    return (isGuest ? GUEST_AVATARS : USER_AVATARS)[avatarIndex(message.senderId || message.senderName, isGuest ? GUEST_AVATARS.length : USER_AVATARS.length)];
  };

  useEffect(() => {
    if (!tenantId) return;
    fetch("/api/chat/rooms").then((r) => r.ok ? r.json() : { rooms: [] }).then((data) => {
      const nextRooms = data.rooms || [];
      setRooms(nextRooms);
      if (!activeRoomId && nextRooms[0]?.id) setActiveRoomId(nextRooms[0].id);
    }).catch(() => undefined);
  }, [tenantId, activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Vercel API functions do not guarantee a persistent WebSocket process. Use
  // authenticated HTTPS polling directly so Firefox never attempts wss://.
  useEffect(() => {
    if (!tenantId || !userId) return;
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const query = activeRoomId ? `?roomId=${encodeURIComponent(activeRoomId)}` : "";
        const response = await fetch(`/api/chat/messages${query}`);
        if (!response.ok) throw new Error("Chat request failed");
        const data = await response.json();
        if (!cancelled) {
          setMessages(data.messages || []);
          setIsConnected(true);
          setConnectionMode("polling");
        }
      } catch {
        if (!cancelled) {
          setIsConnected(false);
          setConnectionMode("disconnected");
        }
      }
    };
    loadMessages();
    const timer = window.setInterval(loadMessages, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [tenantId, userId, activeRoomId]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content) return;
    try {
      const query = activeRoomId ? `?roomId=${encodeURIComponent(activeRoomId)}` : "";
      const response = await fetch(`/api/chat/messages${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send message");
      setMessages((prev) => [...prev, data.message]);
      setIsConnected(true);
      setConnectionMode("polling");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send message");
    }
    setInput("");
    inputRef.current?.focus();
  }, [input, activeRoomId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const createRoom = async () => {
    if (!roomName.trim()) return;
    const response = await fetch("/api/chat/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: roomName, type: roomType }) });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error || "Could not create room");
    setRooms((prev) => [data.room, ...prev]);
    setActiveRoomId(data.room.id);
    setRoomName("");
    setShowRoomForm(false);
    toast.success("Room created");
  };

  const sendGuestInvite = async () => {
    if (!activeRoomId || !inviteEmail.trim() || inviteSending) return;
    setInviteSending(true);
    try {
      const response = await fetch("/api/chat/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoomId,
          email: inviteEmail.trim(),
          subject: inviteSubject.trim(),
          message: inviteMessage.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invitation failed");
      toast.success("Guest invitation sent");
      setInviteEmail("");
      setInviteSubject("");
      setInviteMessage("");
      setShowInvite(false);
    } catch (error: any) {
      toast.error(error?.message || "Invitation failed");
    } finally {
      setInviteSending(false);
    }
  };

  const handleNotify = async () => {
    if (!notifyEmail.trim()) return;
    const recent = messages.slice(-5).map((m) => `${m.senderName}: ${m.content}`).join("\n");
    try {
      const response = await fetch("/api/email-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: notifyEmail.trim(),
          subject: notifySubject.trim() || "Chat Notification",
          html: `<p>Recent messages:</p><pre>${recent.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character] || character))}</pre>`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send notification");
      toast.success("Notification sent!");
      setShowNotify(false);
      setNotifyEmail("");
      setNotifySubject("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send notification");
    }
  };

  if (!session) return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-xl transition-all ${
          isOpen ? "bg-red-500 rotate-45" : "bg-gradient-to-r from-primary-500 to-primary-700"
        }`} title={isOpen ? "Close" : "Chat"}>
        <svg className="w-6 h-6 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 00-2 2v3l4-1.5V17h2a2 2 0 012 2v3l4-1.5V19a2 2 0 00-2-2h-2a2 2 0 01-2-2V8h12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v8h12" />
          }
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] h-[520px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              <div>
                <h3 className="text-white font-semibold text-sm">{rooms.find((room) => room.id === activeRoomId)?.name || "Team Chat"}</h3>
                <select value={activeRoomId || ""} onChange={(event) => setActiveRoomId(event.target.value || undefined)} className="mt-1 max-w-[180px] bg-slate-800 text-[10px] text-slate-400 border border-white/10 rounded px-1 py-0.5">
                  <option value="">Tenant chat</option>
                  {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.type === "INVITE_ONLY" ? "Invite-only" : "Private"}</option>)}
                </select>
              </div>
              <button onClick={() => setShowRoomForm(!showRoomForm)} className="px-2 py-1 text-[10px] text-primary-300 border border-primary-500/30 rounded" title="Create room">+ Room</button>
              <span className="text-xs text-slate-500">({messages.length})</span>
            </div>
            <button onClick={() => setShowNotify(!showNotify)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 text-xs" title="Notify">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 014.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={() => setShowInvite(!showInvite)} disabled={!activeRoomId} className="px-2 py-1 text-[10px] text-primary-300 border border-primary-500/30 rounded disabled:opacity-40" title="Invite guest">Invite</button>
            <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="w-7 h-7 rounded-full bg-primary-500/20 border border-primary-400/30 text-base" title="Choose your avatar">{avatarEmoji}</button>
          </div>

          {showAvatarPicker && (
            <div className="px-4 py-3 border-b border-white/10 bg-slate-800/40">
              <p className="text-[11px] font-semibold text-slate-300 mb-2">Your user avatar</p>
              <p className="text-[10px] text-slate-500 mb-2">Choose from professional and people-focused identities.</p>
              <div className="grid grid-cols-8 gap-1">
                {USER_AVATARS.map((emoji) => <button key={emoji} onClick={() => chooseAvatar(emoji)} className={`h-8 rounded-lg text-lg ${emoji === avatarEmoji ? "bg-primary-500/30 ring-1 ring-primary-300" : "bg-slate-800 hover:bg-slate-700"}`} title={`Use ${emoji} avatar`}>{emoji}</button>)}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Guests are shown with a separate guest avatar style.</p>
            </div>
          )}

          {showRoomForm && (
            <div className="px-4 py-3 border-b border-white/10 bg-slate-800/30 space-y-2">
              <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Room name" className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm" />
              <select value={roomType} onChange={(event) => setRoomType(event.target.value as "PRIVATE" | "INVITE_ONLY")} className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"><option value="PRIVATE">Private</option><option value="INVITE_ONLY">Invite-only</option></select>
              <button onClick={createRoom} disabled={!roomName.trim()} className="w-full py-1.5 bg-primary-500/20 text-primary-300 text-sm rounded-lg disabled:opacity-50">Create room</button>
            </div>
          )}

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

          {showInvite && (
            <div className="px-4 py-3 border-b border-white/10 bg-primary-950/30 space-y-2">
              <p className="text-[11px] font-semibold text-primary-200">Guest invitation template</p>
              <input type="email" placeholder="Guest email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-primary-500/20 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50" />
              <input type="text" placeholder="Subject (optional)" value={inviteSubject} onChange={e => setInviteSubject(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-primary-500/20 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50" />
              <textarea rows={3} placeholder="Add a bespoke message for your guest..." value={inviteMessage} onChange={e => setInviteMessage(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-primary-500/20 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50 resize-none" />
              <p className="text-[10px] text-slate-500">The secure room link and 7-day expiry notice are added automatically.</p>
              <button onClick={sendGuestInvite} disabled={!inviteEmail.trim() || inviteSending || !activeRoomId}
                className="w-full py-1.5 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30 disabled:opacity-50">
                {inviteSending ? "Sending..." : "Send Guest Invitation"}
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
            {messages.map((msg) => {
              const isGuest = msg.senderName.toLowerCase().includes("guest") || msg.senderId.toLowerCase().startsWith("guest");
              return <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
                {msg.senderId !== userId && <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-lg ${isGuest ? "bg-amber-500/20 border border-amber-300/30" : "bg-slate-700 border border-white/10"}`} title={isGuest ? "Guest participant" : "Registered user"}>{getMessageAvatar(msg)}</div>}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.senderId === userId
                    ? "bg-primary-600/20 text-primary-200 border border-primary-500/20"
                    : "bg-slate-800/50 text-slate-200 border border-white/5"
                }`}>
                  <div className="flex items-center gap-2 mb-.5">
                    <span className="text-xs font-medium opacity-70">{msg.senderId === userId ? "You" : msg.senderName}</span>
                    {isGuest && <span className="text-[9px] text-amber-300/80 border border-amber-300/20 rounded px-1">Guest</span>}
                    <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.senderId === userId && <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-lg bg-primary-500/20 border border-primary-400/30" title="Your user avatar">{avatarEmoji}</div>}
              </div>;
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type a message..." disabled={!isConnected}
                className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary-500/50 disabled:opacity-50" />
              <button onClick={sendMessage} disabled={!input.trim() || !isConnected}
                className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-xl hover:bg-primary-500/30 border border-primary-500/30 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m 7 7l-7-7m-7 7l7-7" /></svg>
              </button>
            </div>
            {connectionMode === "disconnected" && <p className="text-xs text-red-400 mt-1">Disconnected. Retrying...</p>}
            {connectionMode === "polling" && <p className="text-xs text-amber-300 mt-1">Connected securely over HTTPS.</p>}
          </div>
        </div>
      )}
    </>
  );
}
