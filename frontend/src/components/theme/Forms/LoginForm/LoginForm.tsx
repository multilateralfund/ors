'use client'
import type { Theme } from '@mui/material'

import React, { useEffect } from 'react'

import styled from '@emotion/styled'
import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

import Field from '@ors/components/manage/Form/Field'
import OrsLoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import Link from '@ors/components/ui/Link/Link'
import Trans from '@ors/components/ui/Trans/Trans'
import { useStore } from '@ors/store'

const LoadingBuffer = styled(OrsLoadingBuffer)(
  ({ theme }: { theme?: Theme }) => `
    background-color: ${theme?.palette.background.default};
  `,
)

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useStore((state) => state.user)

  useEffect(() => {
    if (user.data) {
      setTimeout(() => {
        window.location.replace(searchParams.get('redirect') || '/')
      }, 500)
    }
  }, [user, router, searchParams])

  if (user.data) {
    return (
      <LoadingBuffer text={<Trans id="loading">Stay tuned</Trans>} time={350} />
    )
  }

  return (
    <Paper
      className="flex w-full flex-col rounded-lg p-8"
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        user.login(
          form.get('username')?.toString() || '',
          form.get('password')?.toString() || '',
        )
      }}
    >
      <Typography
        className="mb-4 leading-tight tracking-tight"
        component="h1"
        variant="h4"
      >
        <Trans id="signin">Sign in to your account</Trans>
      </Typography>
      <Field
        id="username"
        name="username"
        autoComplete="username"
        error={!!user.error?.username}
        helperText={user.error?.username}
        InputLabel={{
          className: 'text-lg font-bold',
          label: <Trans id="username">Username</Trans>,
        }}
      />
      <Field
        id="password"
        name="password"
        autoComplete="current-password"
        error={!!user.error?.password}
        helperText={user.error?.password}
        type="password"
        InputLabel={{
          className: 'text-lg font-bold',
          label: <Trans id="password">Password</Trans>,
        }}
      />
      <Typography className="mb-4 text-right">
        <Link
          className="font-bold text-secondary"
          href="forgot-password"
          underline="hover"
        >
          <Trans id="forgot-password">Forgot password?</Trans>
        </Link>
      </Typography>
      <Collapse in={!!user.error?.non_field_errors}>
        <Alert className="mb-4" severity="error">
          {user.error?.non_field_errors}
        </Alert>
      </Collapse>
      <Button
        className="bg-secondary text-lg font-bold shadow-none"
        type="submit"
        variant="contained"
      >
        <Trans id="submit">Submit</Trans>
      </Button>
    </Paper>
  )
}
