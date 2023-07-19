'use client'
import { useRouter } from 'next/navigation'

import useStore from '@ors/store'
import React from 'react'

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
      className="flex flex-col"
    >
      <label htmlFor="username">Username</label>
      <input type="text" name="username" />
      <br />
      <label htmlFor="password">Password</label>
      <input type="password" name="password" />
      <br />
      <input type="submit" value="Submit" />
    </form>
  )
}
