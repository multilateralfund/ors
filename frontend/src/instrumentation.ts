import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  const sentryDsn = import.meta.env.VITE_PUBLIC_SENTRY_DSN
  console.log('sentryDsn: ', sentryDsn)

  if (sentryDsn) {
    console.log("initializing sentry");
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        // You can remove this option if you're not planning to use the Sentry Session Replay feature:
        Sentry.replayIntegration({
          blockAllMedia: true,
          // Additional Replay configuration goes in here, for example:
          maskAllText: true,
        }),
      ],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for tracing.
      // Learn more at
      // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
      tracesSampleRate: 1.0,

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      // Learn more at
      // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }
  Sentry.captureMessage("Test message from frontend");
}
