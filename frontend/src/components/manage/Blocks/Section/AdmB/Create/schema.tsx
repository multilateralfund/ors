import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  colDefByDataType,
  colDefById,
  defaultColDef,
} from '@ors/config/Table/columnsDef'
import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

function useGridOptions(props: { adm_columns: any }) {
  const { adm_columns } = props

  const mapAdmColumn = useCallback((column: any) => {
    return {
      id: column.id,
      category: 'adm',
      dataType: column.type,
      headerName: column.display_name,
      initialWidth: defaultColDef.minWidth,
      ...(colDefByDataType[column.type] || {}),
      ...(column.children.length
        ? {
            children: column.children.map(mapAdmColumn),
            headerGroupComponent: 'agColumnHeaderGroup',
            marryChildren: true,
          }
        : {
            cellEditor:
              column.type === 'date'
                ? 'agAdmDateCellEditor'
                : 'agAdmTextCellEditor',
            field: `adm_${column.id}`,
          }),
      ...(colDefById[column.full_name] || {}),
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
              headerName: '',
              initialWidth: defaultColDef.minWidth,
            },
            {
              cellClass: 'bg-mui-box-background',
              cellRendererParams: (props: any) => ({
                className: cx({
                  'font-bold':
                    props.data.level < 2 &&
                    includes(['title', 'subtitle'], props.data.type),
                  italic:
                    props.data.level < 2 && props.data.type === 'subtitle',
                }),
              }),
              field: 'text',
              headerName: '',
              ...colDefById['type_of_action'],
            },
          ],
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'TYPE OF ACTION / LEGISLATION',
          marryChildren: true,
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
        {
          cellEditor: 'agTextCellEditor',
          field: 'remarks',
          headerName: 'Remarks',
          ...colDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: CellClassParams) => {
          return cx('ag-text-left', {
            'bg-gray-100 theme-dark:bg-gray-900/40':
              includes(props.data?.excluded_columns || [], props.colDef.id) &&
              !includes(['control', 'group', 'hashed'], props.data.rowType),
          })
        },
        // cellClass: 'ag-text-left',
        editable: (props) =>
          includes(props.data?.excluded_columns || [], props.colDef.id) &&
          !includes(NON_EDITABLE_ROWS, props.data.rowType),
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
