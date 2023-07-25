'use client'
import type { ThemeSlice } from '@ors/slices/createThemeSlice'

import React from 'react'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import MuiThemeProvider from '@mui/material/styles/ThemeProvider'
import { useServerInsertedHTML } from 'next/navigation'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'

import useStore from '@ors/store'
import { createTheme } from '@ors/themes'

export default function ThemeProvider({
  children,
  options,
}: {
  children: React.ReactNode
  options: any
}) {
  const theme: ThemeSlice = useStore((state) => state.theme)
  const dir = useStore((state) => state.i18n.dir)

  // https://github.com/emotion-js/emotion/issues/2928#issuecomment-1636030444
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({
      ...options,
      stylisPlugins: [...(options.stylisPlugins || []), prefixer, rtlPlugin],
    })
    cache.compat = true
    const prevInsert = cache.insert
    let inserted: { isGlobal: boolean; name: string }[] = []
    cache.insert = (...args) => {
      const [selector, serialized] = args
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({
          isGlobal: selector === '',
          name: serialized.name,
        })
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prevInserted = inserted
      inserted = []
      return prevInserted
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const inserted = flush()
    if (inserted.length === 0) {
      return null
    }
    let styles = ''
    let dataEmotionAttribute = cache.key

    const globals: {
      name: string
      style: string
    }[] = []

    for (const { isGlobal, name } of inserted) {
      const style = cache.inserted[name]

      if (typeof style === 'boolean') {
        continue
      }

      if (isGlobal) {
        globals.push({ name, style })
      } else {
        styles += style
        dataEmotionAttribute += ` ${name}`
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${cache.key}-global ${name}`}
            dangerouslySetInnerHTML={{
              __html: style,
            }}
          />
        ))}
        {styles !== '' && (
          <style
            data-emotion={dataEmotionAttribute}
            dangerouslySetInnerHTML={{
              __html: styles,
            }}
          />
        )}
      </>
    )
  })

  const currentTheme = React.useMemo(() => theme.mode || 'light', [theme.mode])

  React.useEffect(() => {
    document.documentElement.setAttribute('data-mode', currentTheme)
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    if (!theme.mode) {
      const newMode = prefersDark ? 'dark' : currentTheme
      theme.setMode?.(newMode)
    }
  }, [currentTheme, theme])

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={createTheme(theme.mode || 'light', dir)}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  )
}
