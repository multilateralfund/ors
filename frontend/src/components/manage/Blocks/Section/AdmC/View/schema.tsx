import { AdmColumn } from '@ors/types/api_empty-form'

import { useCallback, useMemo } from 'react'

import { ColDef, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  colDefByDataType,
  colDefById,
  defaultColDef,
} from '@ors/config/Table/columnsDef'

function useGridOptions(props: { adm_columns: AdmColumn[] }) {
  const { adm_columns } = props

  const mapAdmColumn = useCallback((column: AdmColumn): ColDef => {
    return {
      id: column.id,
      category: 'adm',
      dataType: column.type,
      // flex: 1,
      headerName: column.display_name,
      // initialWidth: defaultColDef.minWidth,
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
          cellClass: 'bg-mui-box-background',
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold':
                props.data.level < 2 &&
                includes(['title', 'subtitle'], props.data.type),
            }),
          }),
          field: 'text',
          flex: 2,
          headerClass: 'ag-text-left',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Description',
          ...colDefById['adm_c_description'],
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
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
