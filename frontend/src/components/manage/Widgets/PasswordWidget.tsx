import TextWidget, {
  TextWidgetProps,
} from '@ors/components/manage/Widgets/TextWidget'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import React from 'react'

export default function PasswordWidget({ ...rest }: TextWidgetProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  function handleClickShowPassword() {
    setShowPassword((show) => !show)
  }

  return TextWidget({
    ...rest,
    type: showPassword ? 'text' : 'password',
    InputProps: {
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
    },
  })
}
