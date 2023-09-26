/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'

function cellClass(props: any) {
  if (props.data.isGroup) {
    return 'ag-row-group'
  }
  if (props.data.isSubTotal) {
    return 'ag-row-sub-total'
  }
  if (props.data.isTotal) {
    return 'ag-row-total'
  }
  return ''
}

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
          headerName: 'Previous year price',
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
        cellClass,
        flex: 1,
        minWidth: 200,
      },
    }
  }, [])

  return gridOptions
}

export default useGridOptions
