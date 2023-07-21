'use client'
import React from 'react'

import { Alert, Box, Button, Collapse } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Field from '@ors/components/manage/Form/Field'
import useStore from '@ors/store'

const emptyErrors = {
  non_field_errors: '',
  password: '',
  username: '',
}

export default function LoginForm() {
  const router = useRouter()
  const [errors, setErrors] = React.useState(emptyErrors)
  const user = useStore((state) => state.user)

  React.useEffect(() => {
    if (user.data) {
      router.push('/')
    }
  }, [user, router])

  return (
    <Box
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
      <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        Sign in to your account
      </h1>
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
      <p className="mb-4 text-right">
        <Link href="forgot-password">Forgot password?</Link>
      </p>
      <Collapse in={!!errors.non_field_errors}>
        <Alert className="mb-2" severity="error">
          {errors.non_field_errors}
        </Alert>
      </Collapse>
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Box>
  )
}
