import type { ByLayout } from '@ors/config/Views'

import { find } from 'lodash'

import config from '@ors/config'
import { matchPath } from '@ors/helpers'

export function getCurrentView(pathname: string) {
  return find(config.settings.views, (view) =>
    matchPath(view, pathname || ''),
  ) as { layout: keyof ByLayout; path: string }
}
