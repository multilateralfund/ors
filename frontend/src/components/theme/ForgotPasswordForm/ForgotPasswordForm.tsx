'use client'
import React from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import api from '@ors/helpers/Api/Api'
import { Alert, AlertTitle, Collapse } from '@mui/material'
import Field from '@ors/components/manage/Form/Field'

const emptyErrors = {
  email: '',
  non_field_errors: '',
}

export default function ForgotPasswordForm() {
  const [errors, setErrors] = React.useState(emptyErrors)
  const [isSuccess, setSuccess] = React.useState(false)

  if (isSuccess) {
    return (
      <Alert severity="success" className="mb-2">
        <AlertTitle>Password reset successfully requested</AlertTitle>
        We have emailed you instructions for setting your password, if an
        account exists with the email you entered. You should receive them
        shortly.
      </Alert>
    )
  }

  return (
    <Box
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await api('/api/auth/password/reset/', {
            method: 'post',
            data: { email: form.get('email') },
          })
          setErrors(emptyErrors)
          setSuccess(true)
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
        Forgotten your password? Enter your email address below, and we’ll email
        instructions for setting a new one.
      </p>
      <Field
        InputLabel={{
          label: 'Email',
        }}
        name="email"
        type="email"
        id="user-email"
        autoComplete="email"
        placeholder="user@example.com"
        error={!!errors.email}
        helperText={errors.email}
      />
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
