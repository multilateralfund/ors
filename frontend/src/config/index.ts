import { ByLayout, defaultView, layoutViews, routes } from './Views'
import { ByType, ByWidget, defaultWidget, widgetsMapping } from './Widgets'
import baseConfig, { BaseConfig } from './base'

export interface Config extends BaseConfig {
  settings: BaseConfig['settings'] & {
    defaultView: { layout: string; path: string }
    views: Array<{ layout: string; path: string }>
  }
  views: {
    default: typeof defaultView
    layoutViews: ByLayout
  }
  widgets: {
    default: typeof defaultWidget
    type: ByType
    widget: ByWidget
  }
}

const config: Config = {
  ...baseConfig,
  settings: {
    ...baseConfig.settings,
    defaultView: {
      layout: 'authorized_document',
      path: '*',
    },
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
