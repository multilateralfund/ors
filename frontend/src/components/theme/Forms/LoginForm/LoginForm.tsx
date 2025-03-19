import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useLocation } from 'wouter'
import useSearchParams from '@ors/hooks/useSearchParams'

import Field from '@ors/components/manage/Form/Field'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import Link from '@ors/components/ui/Link/Link'

import { useStore } from '@ors/store'
import { store } from '@ors/_store'

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
        className="login-form flex w-full flex-col rounded-[22px] bg-white/85 p-6"
        component="form"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          await user.login(
            form.get('username')?.toString() || '',
            form.get('password')?.toString() || '',
          )

          const { data, error } = store.current.getState().user

          if (data && !error) {
            window.location.href = searchParams.get('redirect') || '/'
          }
        }}
      >
        <Typography
          className="font-roboto-bold mb-4 text-[21px] leading-tight tracking-tight text-black"
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
          className="rounded-md"
          InputLabel={{
            className: 'text-[15px] text-black font-roboto-bold',
            label: 'Username',
          }}
          InputProps={{
            className: 'rounded-md bg-white',
          }}
        />
        <Field
          id="password"
          name="password"
          autoComplete="current-password"
          error={!!user.error?.password}
          helperText={user.error?.password}
          type="password"
          className="rounded-md"
          InputLabel={{
            className: 'text-[15px] text-black font-roboto-bold',
            label: 'Password',
          }}
          InputProps={{
            className: 'rounded-md bg-white',
          }}
          isLoginInput
        />
        <Typography className="mb-4 text-right">
          <Link
            className="font-roboto-bold text-[#000000a6]"
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
          className="bg-black text-lg text-white shadow-none"
          type="submit"
          variant="contained"
        >
          Submit
        </Button>
      </Paper>
    </>
  )
}
