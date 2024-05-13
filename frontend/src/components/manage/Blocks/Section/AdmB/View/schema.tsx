import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  colDefByDataType,
  colDefById,
  defaultColDef,
} from '@ors/config/Table/columnsDef'

function useGridOptions(props: { adm_columns: any; model: string }) {
  const { adm_columns } = props

  const mapAdmColumn = useCallback((column: any) => {
    return {
      id: column.id,
      category: 'adm',
      dataType: column.type,
      field: 'values',
      flex: 0.5,
      headerName: column.display_name,
      initialWidth: defaultColDef.minWidth,
      ...(colDefByDataType[column.type] || {}),
      ...(column.children.length
        ? {
            children: column.children.map(mapAdmColumn),
            headerGroupComponent: 'agColumnHeaderGroup',
            marryChildren: true,
          }
        : {}),
      ...(colDefById[column.full_name] || {}),
      cellClass: 'ag-text-center',
      headerClass: 'ag-text-center',
    }
  }, [])

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          children: [
            {
              cellClass: 'bg-mui-box-background',
              field: 'index',
              flex: 0.5,
              headerName: '',
              initialWidth: defaultColDef.minWidth,
            },
            {
              ...colDefById['type_of_action'],
              cellClass: 'bg-mui-box-background',
              cellRendererParams: (props: any) => ({
                className: cx({
                  'font-bold':
                    props.data.level < 2 &&
                    includes(['title', 'subtitle'], props.data.type),
                }),
              }),
              field: 'text',
              flex: 3,
              headerName: '',
            },
          ],
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'TYPE OF ACTION / LEGISLATION',
          marryChildren: true,
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
        {
          field: 'remarks',
          flex: 1,
          headerName: 'Remarks',
          ...colDefById['remarks'],
          cellClass: 'ag-text-center',
          headerClass: 'ag-text-center',
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: CellClassParams) => {
          return cx('ag-text-center', {
            'ag-cell-hashed theme-dark:bg-gray-900/40':
              includes(props.data?.excluded_columns || [], props.colDef.id) &&
              !includes(['control', 'group', 'hashed'], props.data.rowType),
          })
        },
        headerClass: 'ag-text-center',
        minWidth: defaultColDef.minWidth,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [adm_columns],
  )

  return gridOptions
}

export default useGridOptions
