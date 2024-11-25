const apiPath = import.meta.env.VITE_PUBLIC_API_PATH
const host = import.meta.env.VITE_PUBLIC_HOST
const protocol = import.meta.env.VITE_PUBLIC_PROTOCOL

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
    theme: import.meta.env.VITE_PUBLIC_COOKIE_THEME || 'theme',
  },
  defaultTheme: 'light',
  settings: {
    apiPath,
    host,
    protocol,
  },
}

export default baseConfig
