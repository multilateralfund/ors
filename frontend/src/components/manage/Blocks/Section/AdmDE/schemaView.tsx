import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

function useGridOptions(props: { model: string }) {
  const { model } = props
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
        {
          field: 'anual',
          headerName: 'Anual',
          initialWidth: 200,
        },
        {
          field: 'cumulative',
          headerName: 'Cumulative',
          initialWidth: 200,
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 400,
        },
      ],
      defaultColDef: {
        headerClass: 'ag-text-center',
        minWidth: 130,
        resizable: true,
      },
    }),
    // eslint-disable-next-line
    [model],
  )

  return gridOptions
}

export default useGridOptions
