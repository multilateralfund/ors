'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

import Button from '@mui/material/Button'
import useStore from '@ors/store'

import Field from './Field'

export default function LoginForm() {
  const router = useRouter()
  const [errors, setErrors] = React.useState({})
  const user = useStore((state) => state.user)

  React.useEffect(() => {
    if (user.data) {
      router.push('/')
    }
  }, [user, router])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await user.login(form.get('username'), form.get('password'))
          setErrors({})
        } catch (error) {
          if (error.status === 400) {
            setErrors(await error.json())
          }
        }
      }}
      className="flex w-full flex-col rounded-lg bg-white p-8 shadow"
    >
      <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
        Sign in to your account
      </h1>
      <Field label="Username" name="username" />
      <Field label="Password" name="password" type="password" />
      <p className="mt-0 text-right">
        <Link href="forgot-password" className="text-primary">
          Forgot password?
        </Link>
      </p>
      <Button variant="contained" type="submit">
        Submit
      </Button>
    </form>
  )
}
