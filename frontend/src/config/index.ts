import { defaultView, layoutViews, routes } from './Views'
import { defaultWidget, widgetsMapping } from './Widgets'

const apiPath = process.env.NEXT_PUBLIC_API_PATH
const apiPrivatePath = process.env.NEXT_PRIVATE_API_PATH

const config = {
  defaultTheme: 'light',
  settings: {
    apiPath,
    apiPrivatePath,
    views: routes,
  },
  views: {
    default: defaultView,
    layoutViews,
  },
  widgets: {
    ...widgetsMapping,
    default: defaultWidget,
  },
}

export default config
