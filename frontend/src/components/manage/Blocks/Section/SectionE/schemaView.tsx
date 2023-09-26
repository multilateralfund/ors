/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react'

import { Typography } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import dayjs from 'dayjs'
import { isNaN, isNull } from 'lodash'

function parseNumber(number: any) {
  const parsedNumber = parseFloat(number)
  return isNull(number) || isNaN(number) ? '-' : parsedNumber.toFixed(2)
}

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
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Total amount generated',
        },
        {
          children: [
            {
              field: 'x',
              headerClass: 'text-center',
              headerName: 'For all uses',
            },
            {
              field: 'x',
              headerClass: 'text-center',
              headerName: 'For feedstock use in your country',
            },
            {
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
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Amount used for feedstock without prior capture',
        },
        {
          field: 'x',
          headerClass: 'text-center',
          headerName: 'Amount destroyed without prior capture',
        },
        {
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
