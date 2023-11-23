'use client'
import { ThemeSlice } from '@ors/types/store'

import React from 'react'

import { IconButton } from '@mui/material'
import cx from 'classnames'

import { useStore } from '@ors/store'

import { IoMoon, IoSunny } from 'react-icons/io5'

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
