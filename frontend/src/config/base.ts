const apiPath = import.meta.env.VITE_PUBLIC_API_PATH || window.location.origin
const host = import.meta.env.VITE_PUBLIC_HOST || window.location.host
const protocol = import.meta.env.VITE_PUBLIC_PROTOCOL || window.location.protocol.split(':')[0]

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
  sentry?: {
    dsn?: string
    environment?: string
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
  sentry: {
    dsn: import.meta.env.VITE_PUBLIC_SENTRY_DSN,
    environment: import.meta.env.VITE_PUBLIC_SENTRY_ENVIRONMENT,
  }
}

export default baseConfig
