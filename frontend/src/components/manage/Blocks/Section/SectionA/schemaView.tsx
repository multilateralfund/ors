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
        {
          children: [
            {
              id: 1,
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Aerosol',
              initialWidth: 130,
            },
            {
              id: 2,
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Foam',
              initialWidth: 130,
            },
            {
              id: 3,
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Fire fighting',
              initialWidth: 130,
            },
            {
              id: 4,
              ...(includes(['II', 'III', 'IV'], model)
                ? {
                    children: [
                      {
                        id: 5,
                        aggFunc: 'sumTotalUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'Manufacturing',
                        initialWidth: 140,
                      },
                      {
                        id: 9,
                        aggFunc: 'sumTotalUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'Servicing',
                        initialWidth: 140,
                      },
                    ],
                    groupId: 'usage_refrigeration',
                    headerClass: 'ag-text-center',
                    headerGroupComponent: 'agColumnHeaderGroup',
                    marryChildren: true,
                  }
                : {
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                  }),
              headerName: 'Refrigeration',
              initialWidth: 140,
            },
            {
              id: 10,
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: includes(['II', 'III', 'IV'], model)
                ? 'Solvent'
                : 'Solvent application',
              initialWidth: includes(['II', 'III', 'IV'], model) ? 130 : 180,
            },
            ...(includes(['I'], model)
              ? [
                  {
                    id: 11,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Fumigation etc.',
                    initialWidth: 130,
                  },
                ]
              : []),
            ...(includes(['I'], model)
              ? [
                  {
                    id: 12,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Other',
                    initialWidth: 130,
                  },
                ]
              : []),
            ...(includes(['II', 'III', 'IV'], model)
              ? [
                  {
                    id: 13,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Process agent',
                    initialWidth: 150,
                  },
                ]
              : []),
            ...(includes(['II'], model)
              ? [
                  {
                    id: 14,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'MDI',
                    initialWidth: 130,
                  },
                ]
              : []),
            ...(includes(['II', 'III', 'IV'], model)
              ? [
                  {
                    id: 15,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Lab use',
                    initialWidth: 130,
                  },
                ]
              : []),
            ...(includes(['II', 'III', 'IV'], model)
              ? [
                  {
                    id: 16,
                    children: [
                      {
                        id: 17,
                        aggFunc: 'sumTotalUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'QPS',
                        initialWidth: 130,
                      },
                      {
                        id: 18,
                        aggFunc: 'sumTotalUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'Non-QPS',
                        initialWidth: 130,
                      },
                    ],
                    groupId: 'usage_methyl_bromide',
                    headerClass: 'ag-text-center',
                    headerGroupComponent: 'agColumnHeaderGroup',
                    headerName: 'Methyl bromide',
                    marryChildren: true,
                  },
                ]
              : []),
            ...(includes(['II'], model)
              ? [
                  {
                    id: 19,
                    aggFunc: 'sumTotalUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Tobacco fluffing',
                    initialWidth: 170,
                  },
                ]
              : []),
            {
              id: 'total',
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'TOTAL',
              initialWidth: 140,
            },
          ],
          groupId: 'usages',
          headerClass: 'ag-text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Use by Sector',
          marryChildren: true,
        },
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
    [model],
  )

  return gridOptions
}

export default useGridOptions
