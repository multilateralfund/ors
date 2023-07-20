'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import useStore from '@ors/store'

import Field from './Field'
import { Alert, Collapse, InputAdornment } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import { IoEye, IoEyeOff } from 'react-icons/io5'

export default function LoginForm() {
  const router = useRouter()
  const emptyErrors = {
    username: '',
    password: '',
    non_field_errors: '',
  }
  const [errors, setErrors] = React.useState(emptyErrors)
  const [showPassword, setShowPassword] = React.useState(false)
  const user = useStore((state) => state.user)
  const handleClickShowPassword = () => setShowPassword((show) => !show)

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
      <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        Sign in to your account
      </h1>
      <Field
        label="Username"
        name="username"
        autoComplete="username"
        error={!!errors.username}
        helperText={errors.username}
      />
      <Field
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <p className="mt-0 text-right">
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
