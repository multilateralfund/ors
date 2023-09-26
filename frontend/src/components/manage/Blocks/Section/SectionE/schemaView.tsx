/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'

function useGridOptions() {
  const gridOptions: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        {
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Facility name or identifier',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Total amount generated',
        },
        {
          children: [
            {
              aggFunc: 'sum',
              cellRenderer: 'agFloatCellRenderer',
              field: 'x',
              headerClass: 'text-center',
              headerName: 'For all uses',
            },
            {
              aggFunc: 'sum',
              cellRenderer: 'agFloatCellRenderer',
              field: 'x',
              headerClass: 'text-center',
              headerName: 'For feedstock use in your country',
            },
            {
              aggFunc: 'sum',
              cellRenderer: 'agFloatCellRenderer',
              field: 'x',
              headerClass: 'text-center',
              headerName: 'For destruction',
            },
          ],
          groupId: 'amount_generated_and_captured',
          headerClass: 'text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Amount generated and captured',
          marryChildren: true,
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Amount used for feedstock without prior capture',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Amount destroyed without prior capture',
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Amount of generated emission',
        },
        {
          field: 'x',
          headerClass: 'text-center',
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
