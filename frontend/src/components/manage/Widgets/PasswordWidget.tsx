import type { TextWidgetProps } from '@ors/components/manage/Widgets/TextWidget'

import React from 'react'

import { IconButton, InputAdornment } from '@mui/material'

import TextWidget from '@ors/components/manage/Widgets/TextWidget'

import { IoEye, IoEyeOff } from 'react-icons/io5'

export type PasswordWidgetProps = TextWidgetProps & { isLoginInput: boolean }

export default function PasswordWidget(
  props: PasswordWidgetProps,
): JSX.Element {
  const { InputProps, isLoginInput } = props
  const color = isLoginInput ? '#000000a6' : ''

  const [showPassword, setShowPassword] = React.useState(false)

  function handleClickShowPassword() {
    setShowPassword((show) => !show)
  }

  return (
    <TextWidget
      {...props}
      type={showPassword ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              edge="end"
              tabIndex={-1}
              onClick={handleClickShowPassword}
            >
              {showPassword ? (
                <IoEyeOff color={color} />
              ) : (
                <IoEye color={color} />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
