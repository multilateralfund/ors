'use client'
import React from 'react'

import { Alert, AlertTitle, Box, Button, Collapse } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import api from '@ors/helpers/Api/Api'

const emptyErrors = {
  email: '',
  non_field_errors: '',
}

export default function ForgotPasswordForm() {
  const [errors, setErrors] = React.useState(emptyErrors)
  const [isSuccess, setSuccess] = React.useState(false)

  if (isSuccess) {
    return (
      <Alert className="mb-2" severity="success">
        <AlertTitle>Password reset successfully requested</AlertTitle>
        We have emailed you instructions for setting your password, if an
        account exists with the email you entered. You should receive them
        shortly.
      </Alert>
    )
  }

  return (
    <Box
      className="flex w-full flex-col rounded-lg p-8"
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await api('/api/auth/password/reset/', {
            data: { email: form.get('email') },
            method: 'post',
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
    >
      <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
        Reset password
      </h1>
      <p className="my-2">
        Forgotten your password? Enter your email address below, and we’ll email
        instructions for setting a new one.
      </p>
      <Field
        id="user-email"
        name="email"
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email}
        placeholder="user@example.com"
        type="email"
        InputLabel={{
          label: 'Email',
        }}
      />
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
