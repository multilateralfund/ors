import { useCallback, useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

const defaultColDef: any = {}

function useGridOptions(props: { adm_columns: any }) {
  const { adm_columns } = props

  const mapAdmColumn = useCallback((column: any) => {
    return {
      id: column.id,
      category: 'adm',
      headerName: column.display_name,
      type: column.type,
      ...(column.children.length
        ? {
            children: column.children.map(mapAdmColumn),
            headerGroupComponent: 'agColumnHeaderGroup',
            marryChildren: true,
          }
        : {}),
      ...(defaultColDef[column.full_name] || {}),
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
          flex: 1,
          headerClass: 'ag-text-left',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Description',
          initialWidth: 200,
        },
        ...(adm_columns.length > 0 ? adm_columns.map(mapAdmColumn) : []),
        {
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-center',
        headerClass: 'ag-text-center',
        minWidth: 130,
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
