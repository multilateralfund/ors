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
        // {
        //   children: [
        //     {
        //       id: 10,
        //       cellEditor: 'agNumberCellEditor',
        //       cellEditorParams: {
        //         min: '0',
        //       },
        //       field: 'aerosol',
        //       headerName: 'Aerosol',
        //       type: 'usages',
        //     },
        //     {
        //       cellEditor: 'agNumberCellEditor',
        //       cellEditorParams: {
        //         min: '0',
        //       },
        //       field: 'foam',
        //       headerName: 'Foam',
        //     },
        //     {
        //       cellEditor: 'agNumberCellEditor',
        //       cellEditorParams: {
        //         min: '0',
        //       },
        //       field: 'fire_fighting',
        //       headerName: 'Fire Fighting',
        //     },
        //     {
        //       children: [
        //         {
        //           cellEditor: 'agNumberCellEditor',
        //           cellEditorParams: {
        //             min: '0',
        //           },
        //           field: 'manufacturing',
        //           headerName: 'Manufacturing',
        //         },
        //         {
        //           cellEditor: 'agNumberCellEditor',
        //           cellEditorParams: {
        //             min: '0',
        //           },
        //           field: 'servicing',
        //           headerName: 'Servicing',
        //         },
        //       ],
        //       headerClass: 'text-center',
        //       headerGroupComponent: 'agColumnHeaderGroup',
        //       headerName: 'Refrigeration',
        //       marryChildren: true,
        //     },
        //     {
        //       disabled: true,
        //       editable: false,
        //       field: 'country',
        //       headerName: 'TOTAL',
        //       valueGetter:
        //         '((data.aerosol || 0) + (data.foam || 0) + (data.fire_fighting || 0) + (data.manufacturing || 0) + (data.servicing || 0)).toFixed(2)',
        //     },
        //   ],
        //   groupId: 'usages',
        //   headerClass: 'text-center usages-group',
        //   headerGroupComponent: 'agColumnHeaderGroup',
        //   headerName: 'Use by Sector',
        //   marryChildren: true,
        // },
        {
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">
                {parseNumber(props.value)}
              </Typography>
            )
          },
          field: 'imports',
          headerName: 'Imports',
        },
        {
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">
                {parseNumber(props.value)}
              </Typography>
            )
          },
          field: 'exports',
          headerName: 'Exports',
        },
        {
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">
                {parseNumber(props.value)}
              </Typography>
            )
          },
          field: 'production',
          headerName: 'Production',
        },
        {
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">{props.value || '-'}</Typography>
            )
          },
          field: 'manufacturing_blends',
          headerName: 'Manufacturing of blends',
        },
        {
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">
                {parseNumber(props.value)}
              </Typography>
            )
          },
          field: 'import_quotas',
          headerName: 'Import Quotas',
        },
        {
          cellRenderer: (props: any) => {
            const value = dayjs(props.value).format('YYYY-MM-DD')
            const finalValue = value !== 'Invalid Date' ? value : '-'
            return <Typography component="span">{finalValue}</Typography>
          },
          field: 'banned_date',
          headerName: 'Date ban commenced (DD/MM/YYYY)',
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
