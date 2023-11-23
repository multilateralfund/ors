import { aggFuncs, components, renderers } from './Table/Table'
import {
  ByError,
  ByLayout,
  defaultView,
  errorViews,
  layoutViews,
  routes,
} from './Views'
import { ByType, ByWidget, defaultWidget, widgetsMapping } from './Widgets'
import baseConfig, { BaseConfig } from './base'

export interface Config extends BaseConfig {
  settings: BaseConfig['settings'] & {
    defaultView: { layout: string; path: string }
    views: Array<{ layout: string; path: string }>
  }
  table: {
    aggFuncs: Record<string, (props: any) => any>
    components: Record<string, React.FC<any>>
    renderers: {
      category: Record<string, string>
      default: string
      type: Record<string, string>
    }
  }
  views: {
    default: typeof defaultView
    errorViews: ByError
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
  table: {
    aggFuncs,
    components,
    renderers,
  },
  views: {
    default: defaultView,
    errorViews,
    layoutViews,
  },
  widgets: {
    ...widgetsMapping,
    default: defaultWidget,
  },
}

export default config
