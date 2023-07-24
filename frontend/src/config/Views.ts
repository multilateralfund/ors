import dynamic from 'next/dynamic'

export interface ByLayout {
  authorized_document?: React.ComponentType<{ children: React.ReactNode }>
  document?: React.ComponentType<{ children: React.ReactNode }>
}

// Default view
export const defaultView = dynamic(
  () => import('@ors/components/theme/Views/DefaultView'),
)

// Layout View Registry
export const layoutViews: ByLayout = {
  authorized_document: dynamic(
    () => import('@ors/components/theme/Views/AuthorizedView'),
  ),
  document: defaultView,
}

export const errorViews = {
  // '404': NotFound,
  // '401': Unauthorized,
  // '403': Forbidden,
  // ECONNREFUSED: ConnectionRefused,
  // corsError: CorsError,
  // LOGIN: RedirectToLogin
}

export const routes = [
  {
    layout: 'document',
    path: '/login',
  },
  {
    layout: 'document',
    path: '/forgot-password',
  },
  {
    layout: 'document',
    path: '/reset-password',
  },
  {
    layout: 'authorized_document',
    path: '*',
  },
]
