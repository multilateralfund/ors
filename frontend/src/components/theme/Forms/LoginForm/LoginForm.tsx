import { useEffect } from 'react'

import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useLocation } from 'wouter'
import useSearchParams from '@ors/hooks/useSearchParams'

import Field from '@ors/components/manage/Form/Field'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import Link from '@ors/components/ui/Link/Link'
import { useStore } from '@ors/store'

export default function LoginForm() {
  const [_, setLocation] = useLocation()
  const searchParams = useSearchParams()
  const user = useStore((state) => state.user)

  // useEffect(() => {
  //   if (user.data) {
  //     setTimeout(() => {
  //       setLocation(searchParams.get('redirect') || '/')
  //     }, 500)
  //   }
  // }, [user, setLocation, searchParams])

  return (
    <>
      <LoadingBuffer
        className="bg-primary text-white"
        active={!!user.data}
        text="Stay tuned"
      />
      <Paper
        className="flex w-full flex-col rounded-lg p-6"
        component="form"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          await user.login(
            form.get('username')?.toString() || '',
            form.get('password')?.toString() || '',
          )
          window.location.href = searchParams.get('redirect') || '/'
        }}
      >
        <Typography
          className="mb-4 font-medium leading-tight tracking-tight"
          component="h1"
          variant="h4"
        >
          Sign in to your account
        </Typography>
        <Field
          id="username"
          name="username"
          autoComplete="username"
          error={!!user.error?.username}
          helperText={user.error?.username}
          InputLabel={{
            className: 'text-lg font-medium',
            label: 'Username',
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
            className: 'text-lg font-medium',
            label: 'Password',
          }}
        />
        <Typography className="mb-4 text-right">
          <Link
            className="font-medium text-secondary"
            href="forgot-password"
            underline="hover"
          >
            Forgot password?
          </Link>
        </Typography>
        <Collapse in={!!user.error?.non_field_errors}>
          <Alert className="mb-4" severity="error">
            {user.error?.non_field_errors}
          </Alert>
        </Collapse>
        <Button
          className="bg-secondary text-lg font-semibold shadow-none"
          type="submit"
          variant="contained"
        >
          Submit
        </Button>
      </Paper>
    </>
  )
}
