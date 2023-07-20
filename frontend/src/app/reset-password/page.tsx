import React from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import type { Metadata } from 'next'
import ResetPasswordForm from '@ors/components/theme/ResetPasswordForm/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ResetPassword() {
  return (
    <PageWrapper className="mx-auto flex h-full w-full max-w-screen-sm flex-col items-center justify-center px-4">
      <ResetPasswordForm />
    </PageWrapper>
  )
}
