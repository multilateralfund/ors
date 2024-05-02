import { aggFuncs, components, renderers } from './Table/Table'
import {
  ByError,
  ByLayout,
  defaultView,
  errorViews,
  layoutViews,
  routes,
} from './Views'
import { defaultWidget, widgetsMapping } from './Widgets'
import baseConfig, { BaseConfig } from './base'

export interface Config extends BaseConfig {
  settings: {
    defaultView: { layout: string; path: string }
    views: Array<{ layout: string; path: string }>
  } & BaseConfig['settings']
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
    type: typeof widgetsMapping.type
    widget: typeof widgetsMapping.widget
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
