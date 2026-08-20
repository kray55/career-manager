import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface InvitePageProps {
  valid: boolean;
  expired?: boolean;
  roomName?: string;
  roomDescription?: string;
  inviterName?: string;
  guestEmail?: string;
  expiresAt?: string;
  token: string;
  joined?: boolean;
}

const RoomInvitePage: NextPage<InvitePageProps> = ({ valid, expired, roomName, roomDescription, inviterName, guestEmail, expiresAt, token, joined }) => {
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/room-invite/${token}`)}`;

  if (!valid) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl p-8 text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-red-500/15 border border-red-400/25 flex items-center justify-center text-2xl">!</div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Career Manager</p>
          <h1 className="mt-3 text-2xl font-semibold">Invitation unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">This room invitation is invalid, has expired, or has already been withdrawn. Ask the organiser to send a new invitation.</p>
          <Link href="/" className="inline-flex mt-6 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white">Return to Career Manager</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#20324d,_#080d18_55%)] text-white flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl">🤝</div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Career Manager</p>
              <p className="text-sm text-slate-400">Secure room invitation</p>
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">You’re invited to join {roomName}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{roomDescription || "A private Career Manager conversation space for focused collaboration."}</p>
        </div>
        <div className="px-8 py-7 space-y-4">
          <div className="rounded-2xl bg-slate-950/40 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Invitation details</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Organiser</dt><dd className="text-slate-200 text-right">{inviterName || "Career Manager host"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Invited guest</dt><dd className="text-slate-200 text-right">{guestEmail}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Access</dt><dd className="text-cyan-200 text-right">Invite-only room</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Expires</dt><dd className="text-slate-200 text-right">{expiresAt ? new Date(expiresAt).toLocaleString() : "In 7 days"}</dd></div>
            </dl>
          </div>
          {joined ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">You have joined this room. Open your dashboard to continue the conversation.</div>
          ) : (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-slate-200">Sign in with the invited email address to join securely. Your room access will be added automatically after authentication.</div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href={joined ? "/dashboard" : loginUrl} className="flex-1 text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30">{joined ? "Open Career Manager" : "Sign in and join room"}</Link>
            <Link href="/" className="flex-1 text-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200">Learn about Career Manager</Link>
          </div>
        </div>
        <div className="px-8 py-4 bg-slate-950/30 border-t border-white/10 text-[11px] leading-5 text-slate-500">For your security, this invitation is tied to the invited email address and expires automatically. Do not forward it to anyone else.</div>
      </section>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps<InvitePageProps> = async ({ params, req, res }) => {
  const token = typeof params?.token === "string" ? params.token : "";
  if (!token) return { props: { valid: false, token: "" } };

  const invite = await prisma.roomInvite.findUnique({
    where: { token },
    include: { room: { select: { name: true, description: true } }, createdBy: { select: { name: true } } },
  });
  if (!invite) return { props: { valid: false, token } };
  if (invite.expiresAt <= new Date() || invite.acceptedAt) {
    return { props: { valid: false, expired: true, token } };
  }

  const session = await getServerSession(req, res, authOptions);
  const sessionUser = session?.user as any;
  if (sessionUser?.id && sessionUser?.tenantId === invite.tenantId && sessionUser.email?.toLowerCase() === invite.email.toLowerCase()) {
    await prisma.chatRoomMember.upsert({ where: { roomId_userId: { roomId: invite.roomId, userId: sessionUser.id } }, update: {}, create: { roomId: invite.roomId, userId: sessionUser.id, role: "MEMBER" } });
    await prisma.roomInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return { props: { valid: true, token, joined: true, roomName: invite.room.name, roomDescription: invite.room.description, inviterName: invite.createdBy.name || undefined, guestEmail: invite.email, expiresAt: invite.expiresAt.toISOString() } };
  }

  return { props: { valid: true, token, roomName: invite.room.name, roomDescription: invite.room.description, inviterName: invite.createdBy.name || undefined, guestEmail: invite.email, expiresAt: invite.expiresAt.toISOString() } };
};

export default RoomInvitePage;
