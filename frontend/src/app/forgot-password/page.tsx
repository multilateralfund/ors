import React from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Login',
}

export default function Login() {
  return (
    <PageWrapper className="flex h-full w-full items-center justify-center">
      <h4>Reset password</h4>
    </PageWrapper>
  )
}
