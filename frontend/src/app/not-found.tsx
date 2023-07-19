'use client'

import Error from '@ors/components/theme/Error/Error'

export default function NotFound() {
  return <Error statusCode={404} message="Page not found" />
}
