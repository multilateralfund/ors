import React from 'react'

import { Alert, Button, Collapse, Paper, Typography } from '@mui/material'
import { useLocation, useSearch } from 'wouter'

import Field from '@ors/components/manage/Form/Field'
import api from '@ors/helpers/Api/_api'

const emptyErrors = {
  new_password1: '',
  new_password2: '',
  non_field_errors: '',
  token: '',
}

export default function ResetPasswordForm({
  endpoint = 'api/auth/password/reset/confirm/',
}: {
  endpoint?: string
}) {
  const [_, setLocation] = useLocation()
  const params = new URLSearchParams(useSearch())

  const [errors, setErrors] = React.useState(emptyErrors)

  return (
    <Paper
      className="reset-pass-form flex w-full flex-col rounded-[22px] bg-white/85 p-8"
      component="form"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        try {
          await api(endpoint, {
            data: {
              new_password1: form.get('new_password1'),
              new_password2: form.get('new_password2'),
              token: params.get('token'),
              uid: params.get('uid'),
            },
            method: 'post',
          })
          setErrors(emptyErrors)
          setLocation('/login')
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
        Change password
      </Typography>
      <Typography className="mb-4 text-black">
        Please enter your new password twice so we can verify you typed it in
        correctly.
      </Typography>
      <Field
        id="new-password1"
        name="new_password1"
        autoComplete="new-password"
        error={!!errors.new_password1}
        helperText={errors.new_password1}
        type="password"
        className="rounded-md"
        InputLabel={{
          className: 'text-black font-roboto-bold',
          label: 'New Password',
        }}
        InputProps={{
          className: 'rounded-md bg-white',
        }}
        isLoginInput
      />
      <Field
        id="new-password2"
        name="new_password2"
        autoComplete="new-password"
        error={!!errors.new_password2}
        helperText={errors.new_password2}
        type="password"
        className="rounded-md"
        InputLabel={{
          className: 'text-black font-roboto-bold',
          label: 'Confirm Password',
        }}
        InputProps={{
          className: 'rounded-md bg-white',
        }}
        isLoginInput
      />
      <Collapse in={!!(errors.non_field_errors || errors.token)}>
        <Alert className="mb-4" severity="error">
          {errors.non_field_errors || errors.token}
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
  )
}
