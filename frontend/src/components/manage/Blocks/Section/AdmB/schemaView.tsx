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
          children: [
            {
              cellClass: 'bg-mui-box-background',
              field: 'index',
              headerName: '',
              initialWidth: 100,
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
              flex: 1,
              headerName: '',
              initialWidth: 200,
            },
          ],
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'TYPE OF ACTION / LEGISLATION',
          marryChildren: true,
        },
        {
          children: [
            {
              headerName: 'Yes/No',
              initialWidth: 150,
            },
            {
              cellRenderer: 'agDateCellRenderer',
              headerName: 'If Yes, since when (Date) / If No, planned date',
              initialWidth: 400,
            },
          ],
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'HCFC',
          marryChildren: true,
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        headerClass: 'ag-text-center',
        minWidth: 80,
        resizable: true,
      },
    }),
    // eslint-disable-next-line
    [model],
  )

  return gridOptions
}

export default useGridOptions
