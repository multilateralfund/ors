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
          field: 'display_name',
          headerName: 'Substance',
        },
        {
          field: 'previous_year_price',
          headerName: 'Captured for all uses',
        },
        {
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
