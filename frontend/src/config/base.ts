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

export async function loadRuntimeConfig() {
  try {
    const response = await fetch(`${apiPath}/api/config/`)
    if (response.ok) {
      const runtimeConfig = await response.json()

      // Merging runtime config (which takes precedence over build-time)
      if (runtimeConfig.sentry) {
        baseConfig.sentry = {
          dsn: runtimeConfig.sentry.dsn || baseConfig.sentry?.dsn,
          environment: runtimeConfig.sentry.environment || baseConfig.sentry?.environment || 'staging',
        }
      }
    }
  } catch (error) {
    console.warn('Could not fetch runtime config, using build-time defaults')
  }
}

export default baseConfig
