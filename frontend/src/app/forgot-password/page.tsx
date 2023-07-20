import React from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import type { Metadata } from 'next'
import ForgotPasswordForm from '@ors/components/theme/ForgotPasswordForm/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ForgotPassword() {
  return (
    <PageWrapper className="mx-auto flex h-full w-full max-w-screen-sm flex-col items-center justify-center px-4">
      <ForgotPasswordForm />
    </PageWrapper>
  )
}
