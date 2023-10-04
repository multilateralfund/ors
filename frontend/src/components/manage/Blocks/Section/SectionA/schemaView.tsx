import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefByUsageId } from '../defaultColDef'

const mapUsage = (usage: any) => ({
  id: usage.id,
  category: usage.columnCategory,
  cellDataType: 'number',
  headerName: usage.headerName,
  ...(colDefByUsageId[usage.id] || {}),
  ...(usage.children.length
    ? {
        children: usage.children.map(mapUsage),
        headerGroupComponent: 'agColumnHeaderGroup',
        marryChildren: true,
      }
    : {
        aggFunc: 'sumTotalUsages',
      }),
})

function useGridOptions(props: { model: string; usages: Array<any> }) {
  const { model, usages } = props
  const gridOptions: GridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(['group', 'total'], props.data.rowType),
            }),
          }),
          field: 'display_name',
          headerClass: 'ag-text-left',
          headerName: 'Substance',
          initialWidth: 300,
          pinned: 'left',
        },
        ...(usages.length
          ? [
              {
                children: [
                  ...usages.map(mapUsage),
                  {
                    id: 'total_usages',
                    aggFunc: 'sumTotalUsages',
                    category: 'usage',
                    headerName: 'TOTAL',
                    initialWidth: 140,
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
          initialWidth: 130,
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'exports',
          headerName: 'Export',
          initialWidth: 130,
        },
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'production',
          headerName: 'Production',
          initialWidth: 130,
        },
        ...(includes(['IV'], model)
          ? [
              {
                aggFunc: 'sumTotal',
                cellRenderer: 'agFloatCellRenderer',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                initialWidth: 150,
              },
            ]
          : []),
        ...(includes(['IV'], model)
          ? [
              {
                cellRenderer: 'agDateCellRenderer',
                field: 'banned_date',
                headerName: 'Date ban commenced (DD/MM/YYYY)',
                initialWidth: 200,
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV'], model)
          ? [
              {
                cellClass: 'ag-text-left',
                field: 'remarks',
                headerName: 'Remarks',
                initialWidth: 300,
              },
            ]
          : []),
      ],
      defaultColDef: {
        autoHeight: true,
        cellClass: (props: any) => {
          return cx({
            'ag-text-right': !includes(['display_name'], props.colDef.field),
            'bg-gray-100 theme-dark:bg-gray-900/40': includes(
              props.data.excluded_usages || [],
              props.colDef.id,
            ),
            'bg-mui-box-background': includes(
              ['display_name'],
              props.colDef.field,
            ),
          })
        },
        headerClass: 'ag-text-center',
        minWidth: 130,
        resizable: true,
        wrapText: true,
      },
    }),
    // eslint-disable-next-line
    [model, usages],
  )

  return gridOptions
}

export default useGridOptions
