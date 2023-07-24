'use client'
import React from 'react'

import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'

import { Field, Link } from '@ors/components'
import useStore from '@ors/store'

const emptyErrors = {
  non_field_errors: '',
  password: '',
  username: '',
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errors, setErrors] = React.useState(emptyErrors)
  const user = useStore((state) => state.user)

  React.useEffect(() => {
    if (user.data) {
      router.push(searchParams.get('redirect') || '/')
    }
  }, [user, router, searchParams])

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
          if (error.status === 400) {
            setErrors({
              ...emptyErrors,
              ...(await error.json()),
            })
          }
        }
      }}
    >
      <Typography
        className="mb-4 leading-tight tracking-tight"
        component="h1"
        variant="h4"
      >
        Sign in to your account
      </Typography>
      <Field
        id="username"
        name="username"
        autoComplete="username"
        error={!!errors.username}
        helperText={errors.username}
        InputLabel={{
          label: 'Username',
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
          label: 'Password',
        }}
      />
      <Typography className="mb-4 text-right">
        <Link href="forgot-password" underline="hover">
          Forgot password?
        </Link>
      </Typography>
      <Collapse in={!!errors.non_field_errors}>
        <Alert className="mb-4" severity="error">
          {errors.non_field_errors}
        </Alert>
      </Collapse>
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Paper>
  )
}
