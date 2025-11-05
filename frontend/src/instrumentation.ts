import * as Sentry from '@sentry/react'
import baseConfig from './config/base'

export function initializeSentry() {
  const { sentry } = baseConfig
  
  // Only initializing if the DSN is set
  if (sentry?.dsn) {
    Sentry.init({
      dsn: sentry.dsn,
      environment: sentry.environment || 'production',
      integrations: [
        Sentry.replayIntegration({
          blockAllMedia: true,
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
    console.log('Sentry initialized:', sentry.environment)
  } else {
    console.log('Sentry not initialized: no DSN was provided')
  }
}
