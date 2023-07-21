import { defaultWidget, widgetsMapping } from './Widgets'

const _DEVELOPMENT_ = process.env.NODE_ENV !== 'production'
const apiPath = process.env.NEXT_PUBLIC_API_PATH
const apiPathTraversal = process.env.NEXT_PUBLIC_API_PATH_TRAVERSAL
const apiPrivatePath = process.env.NEXT_PRIVATE_API_PATH

const config = {
  defaultTheme: 'light',
  settings: {
    _DEVELOPMENT_,
    apiPath,
    apiPathTraversal,
    apiPrivatePath,
    unguardedRoutes: ['/login', '/forgot-password', '/reset-password'],
  },
  widgets: {
    ...widgetsMapping,
    default: defaultWidget,
  },
}

export default config
