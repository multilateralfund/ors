'use client'
import type { Theme } from '@mui/material'

import React, { useEffect, useState } from 'react'

import styled from '@emotion/styled'
import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

import Field from '@ors/components/manage/Form/Field'
import OrsLoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import Link from '@ors/components/ui/Link/Link'
import Trans from '@ors/components/ui/Trans/Trans'
import useStore from '@ors/store'

const emptyErrors = {
  non_field_errors: '',
  password: '',
  username: '',
}

const LoadingBuffer = styled(OrsLoadingBuffer)(
  ({ theme }: { theme?: Theme }) => `
    background-color: ${theme?.palette.background.default};
  `,
)

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errors, setErrors] = useState(emptyErrors)
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
        try {
          await user.login(form.get('username'), form.get('password'))
          setErrors(emptyErrors)
        } catch (error) {
          switch (error.status) {
            case 400:
              setErrors({
                ...emptyErrors,
                ...(await error.json()),
              })
              break
            default:
              setErrors(emptyErrors)
          }
        }
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
        error={!!errors.username}
        helperText={errors.username}
        InputLabel={{
          label: <Trans id="username">Username</Trans>,
        }}
      />
      <Field
        id="password"
        name="password"
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password}
        type="password"
        InputLabel={{
          label: <Trans id="password">Password</Trans>,
        }}
      />
      <Typography className="mb-4 text-right">
        <Link href="forgot-password" underline="hover">
          <Trans id="forgot-password">Forgot password?</Trans>
        </Link>
      </Typography>
      <Collapse in={!!errors.non_field_errors}>
        <Alert className="mb-4" severity="error">
          {errors.non_field_errors}
        </Alert>
      </Collapse>
      <Button type="submit" variant="contained">
        <Trans id="submit">Submit</Trans>
      </Button>
    </Paper>
  )
}
