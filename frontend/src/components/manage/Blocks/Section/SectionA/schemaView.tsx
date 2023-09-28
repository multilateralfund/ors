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
              'font-bold': props.data.isGroup || props.data.isTotal,
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
              aggFunc: 'sumUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Aerosol',
              initialWidth: 130,
            },
            {
              id: 2,
              aggFunc: 'sumUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Foam',
              initialWidth: 130,
            },
            {
              id: 3,
              aggFunc: 'sumUsages',
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
                        aggFunc: 'sumUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'Manufacturing',
                        initialWidth: 140,
                      },
                      {
                        id: 9,
                        aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
                    cellRenderer: 'agUsageCellRenderer',
                  }),
              headerName: 'Refrigeration',
              initialWidth: 140,
            },
            {
              id: 10,
              aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
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
                        aggFunc: 'sumUsages',
                        cellRenderer: 'agUsageCellRenderer',
                        headerName: 'QPS',
                        initialWidth: 130,
                      },
                      {
                        id: 18,
                        aggFunc: 'sumUsages',
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
                    aggFunc: 'sumUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Tobacco fluffing',
                    initialWidth: 170,
                  },
                ]
              : []),
            {
              id: 'total',
              aggFunc: 'sumUsages',
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
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'imports',
          headerName: 'Import',
          initialWidth: 130,
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'exports',
          headerName: 'Export',
          initialWidth: 130,
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'production',
          headerName: 'Production',
          initialWidth: 130,
        },
        ...(includes(['IV'], model)
          ? [
              {
                aggFunc: 'sum',
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
        cellClass: 'ag-text-right',
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

export function getIncludedSubstances(model: string) {
  const includedSubstances: Record<string, any> = {
    I: [1, 3, 4, 6, 7, 8, 9, 21, 22, 24, 28, 37, 40, 102],
    II: [
      1, 3, 4, 6, 7, 8, 9, 10, 11, 21, 22, 24, 28, 30, 34, 37, 38, 40, 47, 48,
      49, 102,
    ],
    III: [22, 24, 28, 30, 38, 34, 37, 40, 47, 48, 49, 102],
    IV: [
      1, 3, 4, 6, 7, 8, 9, 10, 11, 21, 22, 24, 28, 30, 38, 34, 37, 40, 47, 48,
      49, 102,
    ],
  }
  return includedSubstances[model]
}
export default useGridOptions
