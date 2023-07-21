import type { Metadata } from 'next'

import React from 'react'

import LoginForm from '@ors/components/theme/LoginForm/LoginForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Login',
}

export default function Login() {
  return (
    <PageWrapper className="mx-auto flex h-full w-full max-w-screen-sm flex-col items-center justify-center px-4">
      <Logo />
      <LoginForm />
    </PageWrapper>
  )
}
