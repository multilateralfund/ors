const apiPath = process.env.NEXT_PUBLIC_API_PATH
const host = process.env.NEXT_PUBLIC_HOST
const protocol = process.env.NEXT_PUBLIC_PROTOCOL

export type BaseConfig = {
  cookies: {
    theme: string
  }
  defaultTheme: 'dark' | 'light'
  settings: {
    apiPath?: string
    host?: string
    protocol?: string
  }
}

const baseConfig: BaseConfig = {
  cookies: {
    theme: process.env.NEXT_PUBLIC_COOKIE_theme || 'theme',
  },
  defaultTheme: 'light',
  settings: {
    apiPath,
    host,
    protocol,
  },
}

export default baseConfig
