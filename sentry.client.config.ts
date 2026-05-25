import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Session replay for debugging user issues
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  // Enable in development for testing
  environment: process.env.NODE_ENV,

  // Ignore common noise
  ignoreErrors: [
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "The user aborted a request",
  ],
});
