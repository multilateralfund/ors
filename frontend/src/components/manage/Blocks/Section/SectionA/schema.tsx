/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useMemo } from 'react'

import { Typography } from '@mui/material'
import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'

type GridOptionsProps = {
  showUsages: boolean
  substances: Array<any>
}

function useGridOptions({ showUsages, substances }: GridOptionsProps) {
  const gridOptions: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            disableClearable: true,
            getOptionLabel: (option: any) => {
              if (!option) return ''
              return option.formula
            },
            options: substances,
          },
          cellRenderer: (props: any) => {
            return (
              <Typography component="span">{props.value?.formula}</Typography>
            )
          },
          field: 'substance',
          headerName: 'Substance',
        },
        ...(showUsages
          ? [
              {
                children: [
                  {
                    id: 10,
                    cellEditor: 'agNumberCellEditor',
                    cellEditorParams: {
                      min: '0',
                    },
                    field: 'aerosol',
                    headerName: 'Aerosol',
                    type: 'usages',
                  },
                  {
                    cellEditor: 'agNumberCellEditor',
                    cellEditorParams: {
                      min: '0',
                    },
                    field: 'foam',
                    headerName: 'Foam',
                  },
                  {
                    cellEditor: 'agNumberCellEditor',
                    cellEditorParams: {
                      min: '0',
                    },
                    field: 'fire_fighting',
                    headerName: 'Fire Fighting',
                  },
                  {
                    children: [
                      {
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                          min: '0',
                        },
                        field: 'manufacturing',
                        headerName: 'Manufacturing',
                      },
                      {
                        cellEditor: 'agNumberCellEditor',
                        cellEditorParams: {
                          min: '0',
                        },
                        field: 'servicing',
                        headerName: 'Servicing',
                      },
                    ],
                    headerClass: 'text-center',
                    headerGroupComponent: 'agColumnHeaderGroup',
                    headerName: 'Refrigeration',
                    marryChildren: true,
                  },
                  {
                    disabled: true,
                    editable: false,
                    field: 'country',
                    headerName: 'TOTAL',
                    valueGetter:
                      '((data.aerosol || 0) + (data.foam || 0) + (data.fire_fighting || 0) + (data.manufacturing || 0) + (data.servicing || 0)).toFixed(2)',
                  },
                ],
                groupId: 'usages',
                headerClass: 'text-center usages-group',
                headerGroupComponent: 'agColumnHeaderGroup',
                headerName: 'Use by Sector',
                marryChildren: true,
              },
            ]
          : []),
        {
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          field: 'imports',
          headerName: 'Imports',
        },
        {
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          field: 'exports',
          headerName: 'Exports',
        },
        {
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          field: 'production',
          headerName: 'Production',
        },
        {
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            min: '0',
          },
          field: 'import_quotas',
          headerName: 'Import Quotas',
        },
        {
          cellEditor: 'agDateCellEditor',
          cellRenderer: 'agDateCellRenderer',
          field: 'banned_date',
          headerName:
            'If imports are banned, indicate date ban commenced (DD/MM/YYYY)',
        },
        {
          cellEditor: 'agTextCellEditor',
          cellEditorPopup: true,
          field: 'remarks',
          headerName: 'Remarks',
        },
      ],
      defaultColDef: {
        cellClass: (props) => {
          return cx({
            disabled:
              props.colDef.disabled ||
              (props.colDef.type === 'usages' &&
                props.data.substance?.excluded_usages?.includes(
                  props.colDef.id,
                )),
          })
        },
        editable: (props) => {
          if (
            props.colDef.type === 'usages' &&
            props.data.substance?.excluded_usages?.includes(props.colDef.id)
          ) {
            return false
          }
          return true
        },
        flex: 1,
        minWidth: 200,
        resizable: true,
      },
    }
  }, [substances, showUsages])

  return gridOptions
}

export default useGridOptions
