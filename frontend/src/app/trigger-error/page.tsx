'use client'

import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_ENVIRONMENT } from '@ors/constants'

export default function TriggerError() {
  return (
    <button
      type="button"
      onClick={() => {
        console.log('PUBLIC_SENTRY_DSN', PUBLIC_SENTRY_DSN)
        console.log('PUBLIC_SENTRY_ENVIRONMENT', PUBLIC_SENTRY_ENVIRONMENT)
        throw new Error('Sentry Frontend Error')
      }}
    >
      Throw error
    </button>
  )
}
