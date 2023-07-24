'use client'
import React from 'react'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import MuiThemeProvider from '@mui/material/styles/ThemeProvider'
import Cookies from 'js-cookie'
import { useServerInsertedHTML } from 'next/navigation'

import useStore from '@ors/store'
import { createTheme } from '@ors/themes'

export default function ThemeProvider({
  children,
  options,
}: {
  children: React.ReactNode
  options: any
}) {
  const themeManager = useStore((state) => ({
    setTheme: state.setTheme,
    theme: state.theme,
  }))

  // https://github.com/emotion-js/emotion/issues/2928#issuecomment-1636030444
  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache(options)
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

  const currentTheme = React.useMemo(
    () => themeManager.theme || 'light',
    [themeManager.theme],
  )

  React.useEffect(() => {
    document.documentElement.setAttribute('data-mode', currentTheme)
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    if (!themeManager.theme) {
      const newTheme = prefersDark ? 'dark' : currentTheme
      themeManager.setTheme(newTheme)
      Cookies.set('theme', newTheme)
    }
  }, [currentTheme, themeManager])

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={createTheme(themeManager.theme || 'light')}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  )
}
