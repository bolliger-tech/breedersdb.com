import { defineBoot } from '#q-app/wrappers';
import * as Sentry from '@sentry/vue';

export default defineBoot(({ app }) => {
  if (!process.env.SENTRY_DSN) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('SENTRY_DSN is not defined. Sentry will not be used.');
    }
    return;
  }
  Sentry.init({
    app,
    dsn: process.env.SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [/^https:\/\/.*\.breedersdb\.com\//],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
});
