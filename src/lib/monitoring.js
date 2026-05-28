import * as Sentry from '@sentry/react';

let enabled = false;

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, { source: 'unhandledrejection' });
  });

  enabled = true;
  return true;
}

export function captureException(error, context) {
  if (enabled) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
  console.error(error);
}

export { Sentry };
