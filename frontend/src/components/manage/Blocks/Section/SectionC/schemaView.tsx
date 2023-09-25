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
          field: 'previous_year_price',
          headerName:
            'Previous year price (prefilled - online submission, if available)',
        },
        {
          field: 'current_year_price',
          headerName: 'Current prices',
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
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
