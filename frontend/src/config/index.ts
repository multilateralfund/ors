import { defaultView, errorViews, layoutViews } from './Views'
import { defaultWidget, widgetMapping } from './Widgets'

const _DEVELOPMENT_ = process.env.NODE_ENV !== 'production'
const apiPath = process.env.NEXT_PUBLIC_API_PATH
const apiPathTraversal = process.env.NEXT_PUBLIC_API_PATH_TRAVERSAL

const config = {
  defaultTheme: 'light',
  settings: {
    unguardedRoutes: ['/login', '/forgot-password'],
    apiPath,
    apiPathTraversal,
    _DEVELOPMENT_,
  },
  views: {
    layoutViews,
    defaultView,
    errorViews,
  },
  widgets: {
    ...widgetMapping,
    default: defaultWidget,
  },
}

export default config
