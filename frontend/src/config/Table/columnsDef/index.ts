/* eslint-disable perfectionist/sort-objects */
import { ColDef } from 'ag-grid-community'

import getAdmsColDef from './admsColDef'
import defaultColDef from './defaultColDef'
import defaultColGroupDef from './defaultColGroupDef'
import getUsagesColDef from './usagesColDef'

const mobile = __CLIENT__ ? window.innerWidth < 768 : false

const colDefById: Record<string, ColDef> = {
  display_name: {
    initialWidth: mobile ? 160 : 200,
    minWidth: 160,
    pinned: mobile ? undefined : 'left',
  },
  facility: {
    initialWidth: mobile ? 160 : 200,
    minWidth: 160,
    pinned: mobile ? undefined : 'left',
  },
  imports: {
    initialWidth: defaultColDef.minWidth,
  },
  exports: {
    initialWidth: defaultColDef.minWidth,
  },
  manufacturing_blends: {
    initialWidth: 210,
  },
  production: {
    initialWidth: 100,
  },
  import_quotas: {
    initialWidth: defaultColDef.minWidth,
  },
  previous_year_price: {
    initialWidth: 160,
  },
  current_year_price: {
    initialWidth: 160,
  },
  banned_date: {
    initialWidth: 190,
  },
  remarks: {
    initialWidth: mobile ? 200 : 250,
  },
  total_amount_generated: {
    initialWidth: 120,
  },
  all_uses: {
    initialWidth: 140,
  },
  feedstock: {
    initialWidth: 140,
  },
  feedstock_gc: {
    initialWidth: 120,
  },
  feedstock_wpc: {
    initialWidth: 120,
  },
  destruction: {
    initialWidth: 140,
  },
  destruction_wpc: {
    initialWidth: 120,
  },
  generated_emissions: {
    initialWidth: 120,
  },
  ...getAdmsColDef(),
  ...getUsagesColDef(),
}

const colDefByDataType: Record<string, ColDef> = {
  date: {
    initialWidth: 150,
  },
}

export { colDefByDataType, colDefById, defaultColDef, defaultColGroupDef }
