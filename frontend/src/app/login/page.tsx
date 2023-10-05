import type { Metadata } from 'next'

import React from 'react'

import LoginForm from '@ors/components/theme/Forms/LoginForm/LoginForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Login',
}

export default function Login() {
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      defaultSpacing={false}
      fill
    >
      <Logo className="mb-5" />
      <LoginForm />
    </PageWrapper>
  )
}
