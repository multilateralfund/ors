'use client'
import React from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import api from '@ors/helpers/Api/Api'
import { Alert, Collapse } from '@mui/material'
import Field from '@ors/components/manage/Form/Field'
import { useRouter, useSearchParams } from 'next/navigation'

const emptyErrors = {
  new_password1: '',
  new_password2: '',
  token: '',
  non_field_errors: '',
}

export default function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [errors, setErrors] = React.useState(emptyErrors)

  return (
    <Box
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await api('/api/auth/password/reset/confirm/', {
            method: 'post',
            data: {
              uid: params.get('uid'),
              token: params.get('token'),
              new_password1: form.get('new_password1'),
              new_password2: form.get('new_password2'),
            },
          })
          setErrors(emptyErrors)
          router.push('/')
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
        Reset password
      </h1>
      <p className="my-2">
        Please enter your new password twice so we can verify you typed it in
        correctly.
      </p>
      <Field
        InputLabel={{
          label: 'Password',
        }}
        id="new-password1"
        name="new_password1"
        type="password"
        autoComplete="new-password"
        error={!!errors.new_password1}
        helperText={errors.new_password1}
      />
      <Field
        InputLabel={{
          label: 'Confirm Password',
        }}
        id="new-password2"
        name="new_password2"
        type="password"
        autoComplete="new-password"
        error={!!errors.new_password2}
        helperText={errors.new_password2}
      />
      <Collapse in={!!(errors.non_field_errors || errors.token)}>
        <Alert severity="error" className="mb-2">
          {errors.non_field_errors || errors.token}
        </Alert>
      </Collapse>
      <Button variant="contained" type="submit">
        Submit
      </Button>
    </Box>
  )
}
