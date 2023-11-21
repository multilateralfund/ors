import AuthorizedView from '@ors/components/theme/Views/AuthorizedView'
import BadRequest from '@ors/components/theme/Views/BadRequest'
import ConnectionRefused from '@ors/components/theme/Views/ConnectionRefused'
import DefaultView from '@ors/components/theme/Views/DefaultView'
import Forbidden from '@ors/components/theme/Views/Forbidden'
import NotFound from '@ors/components/theme/Views/NotFound'
import PrintView from '@ors/components/theme/Views/PrintView'
import Unauthorized from '@ors/components/theme/Views/Unauthorized'

export interface ByLayout {
  authorized_document?: typeof AuthorizedView
  document?: typeof DefaultView
  print?: typeof PrintView
}

export interface ByError {
  400?: typeof BadRequest
  401?: typeof Unauthorized
  403?: typeof Forbidden
  404?: typeof NotFound
  ECONNREFUSED?: typeof ConnectionRefused
  TypeError?: typeof ConnectionRefused
}

// Default view
export const defaultView = DefaultView

// Layout View Registry
export const layoutViews: ByLayout = {
  authorized_document: AuthorizedView,
  document: defaultView,
  print: PrintView,
}

export const errorViews: ByError = {
  400: BadRequest,
  401: Unauthorized,
  403: Forbidden,
  404: NotFound,
  ECONNREFUSED: ConnectionRefused,
  TypeError: ConnectionRefused,
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
