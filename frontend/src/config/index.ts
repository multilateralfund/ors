import { ByLayout, defaultView, layoutViews, routes } from './Views'
import { ByType, ByWidget, defaultWidget, widgetsMapping } from './Widgets'
import baseConfig, { BaseConfig } from './base'

export interface Config extends BaseConfig {
  settings: BaseConfig['settings'] & {
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
