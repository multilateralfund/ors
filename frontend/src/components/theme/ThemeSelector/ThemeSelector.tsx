'use client'
import React from 'react'

import { IconButton } from '@mui/material'
import cx from 'classnames'
import Cookies from 'js-cookie'

import useStore from '@ors/store'

import {IoMoon} from '@react-icons/all-files/io5/IoMoon'
import {IoSunny} from '@react-icons/all-files/io5/IoSunny'

export default function ThemeSelector() {
  const themeManager = useStore((state) => ({
    setTheme: state.setTheme,
    theme: state.theme,
  }))
  const theme = themeManager.theme

  return (
    <IconButton
      className={cx({
        'text-primary': theme !== 'dark',
        'text-white': theme === 'dark',
      })}
      aria-label="toggle-theme"
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
