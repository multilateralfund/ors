'use client'
import cx from 'classnames'
import Cookies from 'js-cookie'
import React from 'react'
import { IoMoon, IoSunny } from 'react-icons/io5'

import IconButton from '@mui/material/IconButton'
import useStore from '@ors/store'

export default function ThemeSelector() {
  const themeManager = useStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }))
  const theme = themeManager.theme

  return (
    <IconButton
      aria-label="toggle-theme"
      className={cx({
        'text-primary': theme !== 'dark',
        'text-white': theme === 'dark',
      })}
      onClick={() => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        themeManager.setTheme(newTheme)
        Cookies.set('theme', newTheme)
      }}
    >
      {theme === 'dark' ? <IoMoon /> : <IoSunny />}
    </IconButton>
  )
}
