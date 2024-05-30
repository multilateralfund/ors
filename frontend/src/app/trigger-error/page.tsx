'use client'

export default function TriggerError() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error('Sentry Frontend Error')
      }}
    >
      Throw error
    </button>
  )
}
