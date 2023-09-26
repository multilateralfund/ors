/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'

function useGridOptions() {
  const gridOptions: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        {
          field: 'chemical_name',
          headerName: 'Substance',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'previous_year_price',
          headerName: 'Captured for all uses',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'current_year_price',
          headerName: 'Captured for feedstock uses within your country',
        },
        {
          field: 'remarks',
          headerName: 'Captured for destruction',
        },
      ],
      defaultColDef: {
        flex: 1,
        minWidth: 200,
      },
    }
  }, [])

  return gridOptions
}

export default useGridOptions
