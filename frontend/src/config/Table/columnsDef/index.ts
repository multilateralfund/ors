/* eslint-disable perfectionist/sort-objects */
import { ColDef } from 'ag-grid-community'

import getAdmsColDef from './admsColDef'
import defaultColDef from './defaultColDef'
import getUsagesColDef from './usagesColDef'

const mobile = __CLIENT__ ? window.innerWidth < 768 : false

const colDefById: Record<string, ColDef> = {
  display_name: {
    initialWidth: mobile ? 150 : 200,
    pinned: mobile ? undefined : 'left',
  },
  facility: {
    initialWidth: mobile ? 150 : 200,
    pinned: mobile ? undefined : 'left',
  },
  imports: {
    initialWidth: defaultColDef.minWidth,
  },
  exports: {
    initialWidth: defaultColDef.minWidth,
  },
  production: {
    initialWidth: defaultColDef.minWidth,
  },
  manufacturing_blends: {
    initialWidth: defaultColDef.minWidth,
  },
  import_quotas: {
    initialWidth: defaultColDef.minWidth,
  },
  previous_year_price: {
    initialWidth: defaultColDef.minWidth,
  },
  current_year_price: {
    initialWidth: defaultColDef.minWidth,
  },
  banned_date: {
    initialWidth: 150,
  },
  remarks: {
    initialWidth: mobile ? 200 : 250,
  },
  total_amount_generated: {
    initialWidth: defaultColDef.minWidth,
  },
  all_uses: {
    initialWidth: defaultColDef.minWidth,
  },
  feedstock: {
    initialWidth: defaultColDef.minWidth,
  },
  feedstock_gc: {
    initialWidth: defaultColDef.minWidth,
  },
  feedstock_wpc: {
    initialWidth: defaultColDef.minWidth,
  },
  destruction: {
    initialWidth: defaultColDef.minWidth,
  },
  destruction_wpc: {
    initialWidth: defaultColDef.minWidth,
  },
  generated_emissions: {
    initialWidth: defaultColDef.minWidth,
  },
  ...getAdmsColDef(),
  ...getUsagesColDef(),
}

export { colDefById, defaultColDef }
