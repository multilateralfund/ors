import AuthorizedView from '@ors/components/theme/Views/AuthorizedView'
import DefaultView from '@ors/components/theme/Views/DefaultView'
import PrintView from '@ors/components/theme/Views/PrintView'

export interface ByLayout {
  authorized_document?: typeof AuthorizedView
  document?: typeof DefaultView
  print?: typeof PrintView
}

// Default view
export const defaultView = DefaultView

// Layout View Registry
export const layoutViews: ByLayout = {
  authorized_document: AuthorizedView,
  document: defaultView,
  print: PrintView,
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
    layout: 'print',
    path: '/**/print',
  },
  {
    layout: 'document',
    path: '/econnrefused',
  },
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
