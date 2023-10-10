import { AgAdmCellRenderer } from '@ors/components/manage/AgCellRenderers/AgAdmCellRenderer'

import defaultComponents from './components'

export { default as aggFuncs } from './aggFuncs'
export { default as renderers } from './renderers'

export const components = {
  agAdmCellRenderer: AgAdmCellRenderer,
  ...defaultComponents,
}
