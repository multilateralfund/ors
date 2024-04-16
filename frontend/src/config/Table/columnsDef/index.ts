/* eslint-disable perfectionist/sort-objects */
import { ColDef } from 'ag-grid-community'

import getAdmsColDef from './admsColDef'
import defaultColDef, { defaultColDefEdit } from './defaultColDef'
import defaultColGroupDef from './defaultColGroupDef'
import getUsagesColDef from './usagesColDef'

const mobile = __CLIENT__ ? window.innerWidth < 768 : false

const colDefById: Record<string, ColDef> = {
  display_name: {
    initialWidth: mobile ? 160 : 300,
    minWidth: 160,
    pinned: mobile ? undefined : 'left',
  },
  facility: {
    initialWidth: mobile ? 160 : 300,
    minWidth: 160,
    pinned: mobile ? undefined : 'left',
  },
  imports: {
    initialWidth: 84,
    flex: 0,
  },
  exports: {
    initialWidth: 84,
    flex: 0,
  },
  manufacturing_blends: {
    flex: 1,
    initialWidth: 116,
  },
  production: {
    initialWidth: 84,
    flex: 0,
  },
  import_quotas: {
    initialWidth: 84,
    flex: 0,
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
    initialWidth: 250,
  },
  all_uses: {
    initialWidth: 140,
  },
  feedstock: {
    initialWidth: 280,
  },
  feedstock_gc: {
    initialWidth: 300,
  },
  feedstock_wpc: {
    initialWidth: 250,
  },
  destruction: {
    initialWidth: 280,
  },
  destruction_wpc: {
    initialWidth: 250,
  },
  generated_emissions: {
    initialWidth: 200,
  },
  ...getAdmsColDef(),
  ...getUsagesColDef(),
}

const colDefByDataType: Record<string, ColDef> = {
  date: {
    initialWidth: 150,
  },
}

export {
  colDefByDataType,
  colDefById,
  defaultColDef,
  defaultColDefEdit,
  defaultColGroupDef,
}
