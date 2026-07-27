// ──────────────────────────────────────────────
// Pilot Invite Acceptance Page (T15-B)
// Uses query param token: /invite?token=xxx
// ──────────────────────────────────────────────
import { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.query;
  if (!token || typeof token !== "string") {
    return { props: { error: "Invalid invite token." } };
  }

  const invite = await prisma.pilotInvite.findUnique({ where: { token } });
  if (!invite) return { props: { error: "Invite not found or expired." } };
  if (invite.acceptedAt) return { props: { error: "This invite has already been accepted." } };

  await prisma.pilotInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

  return {
    props: { success: true, email: invite.email },
  };
};

export default function AcceptInvite({ error, success, email }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="bg-white/5 border border-white/10 rounded-xl p-10 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Invite Invalid</h1>
            <p className="text-slate-400 text-sm">{error}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Welcome to the Pilot!</h1>
            <p className="text-slate-400 text-sm mb-4">
              Your invitation for <strong className="text-white">{email}</strong> has been accepted.
            </p>
            <a href="/login" className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium">
              Sign In to Get Started
            </a>
          </>
        )}
      </div>
    </div>
  );
}
