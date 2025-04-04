'use client'
import React from 'react'

import {
  Alert,
  AlertTitle,
  Button,
  Collapse,
  Paper,
  Typography,
} from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import api from '@ors/helpers/Api/_api'

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
        <AlertTitle className="font-roboto-bold">
          Password reset successfully requested
        </AlertTitle>
        We have emailed you instructions for setting your password, if an
        account exists with the email you entered. You should receive them
        shortly.
      </Alert>
    )
  }

  return (
    <Paper
      className="reset-pass-form flex w-full flex-col rounded-[22px] bg-white/85 p-8"
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await api('api/auth/password/reset/', {
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
      <Typography
        className="font-roboto-bold mb-4 text-[21px] leading-tight tracking-tight text-black"
        component="h1"
        variant="h4"
      >
        Reset password
      </Typography>
      <Typography className="mb-4 text-black">
        Forgotten your password? Enter your email address below, and we&apos;ll
        email instructions for setting a new one.
      </Typography>
      <Field
        id="user-email"
        name="email"
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email}
        placeholder="user@example.com"
        type="email"
        className="rounded-md"
        InputLabel={{
          className: 'text-black font-roboto-bold',
          label: 'Email',
        }}
        InputProps={{
          className: 'rounded-md bg-white',
        }}
      />
      <Collapse in={!!errors.non_field_errors}>
        <Alert severity="error">{errors.non_field_errors}</Alert>
      </Collapse>
      <Button
        className="bg-black text-lg text-white shadow-none"
        type="submit"
        variant="contained"
      >
        Submit
      </Button>
    </Paper>
  )
}
