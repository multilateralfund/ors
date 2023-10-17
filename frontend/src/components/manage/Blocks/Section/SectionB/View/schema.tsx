import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

function useGridOptions(props: { usages: Array<any> }) {
  const { usages } = props
  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'bg-mui-box-background',
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(['group', 'total'], props.data.rowType),
            }),
          }),
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: 'Substance',
          ...colDefById['display_name'],
        },
        ...(usages.length
          ? [
              {
                children: [
                  ...usages,
                  {
                    id: 'total_usages',
                    aggFunc: 'sumTotalUsages',
                    category: 'usage',
                    headerName: 'TOTAL',
                    ...colDefById['total_usages'],
                  },
                ],
                headerGroupComponent: 'agColumnHeaderGroup',
                headerName: 'Use by Sector',
                marryChildren: true,
              },
            ]
          : []),
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'imports',
          headerName: 'Import',
          ...colDefById['imports'],
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'exports',
          headerName: 'Export',
          ...colDefById['exports'],
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'production',
          headerName: 'Production',
          ...colDefById['production'],
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'manufacturing_blends',
          headerName: 'Manufacturing of Blends',
          ...colDefById['manufacturing_blends'],
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'import_quotas',
          headerName: 'Import Quotas',
          ...colDefById['import_quotas'],
        },
        {
          cellRenderer: 'agDateCellRenderer',
          field: 'banned_date',
          headerName: 'Date ban commenced (DD/MM/YYYY)',
          ...colDefById['banned_date'],
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
          ...colDefById['remarks'],
        },
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: 'ag-text-right',
        headerClass: 'ag-text-center',
        minWidth: defaultColDef.minWidth,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [usages],
  )

  return gridOptions
}

export default useGridOptions
