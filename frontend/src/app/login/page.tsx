import type { Metadata } from 'next'

import React from 'react'

import { LoginForm, Logo, PageWrapper } from '@ors/components'

export const metadata: Metadata = {
  title: 'Login',
}

export default function Login() {
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      fill
    >
      <Logo />
      <LoginForm />
    </PageWrapper>
  )
}
