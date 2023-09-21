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
          headerName: 'Facility name or identifier',
        },
        {
          field: 'x',
          headerName: 'Total amount generated1',
        },
        {
          field: 'x',
          headerName: 'Amount generated and captured',
        },
        {
          field: 'x',
          headerName: 'Amount used for feedstock without prior capture',
        },
        {
          field: 'x',
          headerName: 'Amount destroyed without prior capture',
        },
        {
          field: 'x',
          headerName: 'Amount of generated emission',
        },
        {
          field: 'x',
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
