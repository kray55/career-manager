// ──────────────────────────────────────────────
// Sentry Client Configuration (T15-A)
// ──────────────────────────────────────────────
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: .1,
  replaysSessionSampleRate: .1,
  replaysOnErrorSampleRate: 1.,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
