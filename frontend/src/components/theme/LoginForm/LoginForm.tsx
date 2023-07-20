'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Field from '@ors/components/manage/Form/Field'
import useStore from '@ors/store'

const emptyErrors = {
  username: '',
  password: '',
  non_field_errors: '',
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
      className="flex w-full flex-col rounded-lg p-8"
    >
      <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        Sign in to your account
      </h1>
      <Field
        InputLabel={{
          label: 'Username',
        }}
        id="username"
        name="username"
        autoComplete="username"
        error={!!errors.username}
        helperText={errors.username}
      />
      <Field
        InputLabel={{
          label: 'Password',
        }}
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password}
      />
      <p className="mb-4 text-right">
        <Link href="forgot-password">Forgot password?</Link>
      </p>
      <Collapse in={!!errors.non_field_errors}>
        <Alert severity="error" className="mb-2">
          {errors.non_field_errors}
        </Alert>
      </Collapse>
      <Button variant="contained" type="submit">
        Submit
      </Button>
    </Box>
  )
}
