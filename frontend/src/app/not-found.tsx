'use client'

import Error from '@ors/components/theme/Error/Error'

export default function NotFound() {
  return <Error message="Page not found" statusCode={404} />
}
