import type { Metadata } from 'next'

import React from 'react'

import ResetPasswordForm from '@ors/components/theme/Forms/ResetPasswordForm/ResetPasswordForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ResetPassword() {
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      defaultSpacing={false}
      fill
    >
      <ResetPasswordForm />
    </PageWrapper>
  )
}
