import type { Metadata } from 'next'

import React from 'react'

import ForgotPasswordForm from '@ors/components/theme/ForgotPasswordForm/ForgotPasswordForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ForgotPassword() {
  return (
    <PageWrapper className="mx-auto flex h-full w-full max-w-screen-sm flex-col items-center justify-center px-4">
      <Logo />
      <ForgotPasswordForm />
    </PageWrapper>
  )
}
