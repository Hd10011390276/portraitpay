import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Enable server-side error tracking
  environment: process.env.NODE_ENV,

  // Max breadcrumbs for debugging
  maxBreadcrumbs: 50,

  // Ignore common noise
  ignoreErrors: [
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "The user aborted a request",
  ],
});
