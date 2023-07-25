'use client'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import React from 'react'

import { IconButton } from '@mui/material'
import cx from 'classnames'

import useStore from '@ors/store'

import { IoMoon } from '@react-icons/all-files/io5/IoMoon'
import { IoSunny } from '@react-icons/all-files/io5/IoSunny'

export default function ThemeSelector() {
  const theme: ThemeSlice = useStore((state) => state.theme)

  return (
    <IconButton
      className={cx({
        'text-primary': theme.mode !== 'dark',
        'text-white': theme.mode === 'dark',
      })}
      aria-label="toggle-theme"
      onClick={() => {
        const newMode = theme.mode === 'dark' ? 'light' : 'dark'
        theme.setMode?.(newMode)
      }}
    >
      {theme.mode === 'dark' ? <IoMoon /> : <IoSunny />}
    </IconButton>
  )
}
