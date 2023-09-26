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
          headerName: 'Previous year price',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'current_year_price',
          headerName: 'Current prices',
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
        },
      ],
      defaultColDef: {
        cellClassRules: {
          'ag-cell-group': (props) => props.data.isGroup,
          'ag-cell-sub-total': (props) => props.data.isSubTotal,
          'ag-cell-total': (props) => props.data.isTotal,
        },
        flex: 1,
        minWidth: 200,
      },
    }
  }, [])

  return gridOptions
}

export default useGridOptions
