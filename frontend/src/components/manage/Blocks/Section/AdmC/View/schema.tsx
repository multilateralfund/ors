import { useCallback, useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  colDefByDataType,
  colDefById,
  defaultColDef,
} from '@ors/config/Table/columnsDef'

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
        : {}),
      ...(colDefById[column.full_name] || {}),
    }
  }, [])

  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'bg-mui-box-background',
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold':
                props.data.level < 2 &&
                includes(['title', 'subtitle'], props.data.type),
              italic: props.data.level < 2 && props.data.type === 'subtitle',
            }),
          }),
          field: 'text',
          headerClass: 'ag-text-left',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Description',
          ...colDefById['adm_c_description'],
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
        {
          field: 'remarks',
          headerName: 'Remarks',
          ...colDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-center',
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
