import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'

function useGridOptions() {
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
          headerName: 'Substance',
          initialWidth: 150,
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
              children: [
                {
                  id: 5,
                  children: [
                    {
                      id: 6,
                      aggFunc: 'sumUsages',
                      cellRenderer: 'agUsageCellRenderer',
                      headerName: 'Other',
                      initialWidth: 130,
                    },
                    {
                      id: 7,
                      aggFunc: 'sumUsages',
                      cellRenderer: 'agUsageCellRenderer',
                      headerName: 'AC',
                      initialWidth: 130,
                    },
                    {
                      id: 'total_refrigeration',
                      aggFunc: 'sumUsages',
                      cellRenderer: 'agUsageCellRenderer',
                      headerName: 'Total',
                      initialWidth: 130,
                    },
                  ],
                  groupId: 'usage_refrigeration_manufacturing',
                  headerClass: 'ag-text-center',
                  headerGroupComponent: 'agColumnHeaderGroup',
                  headerName: 'Manufacturing',
                  marryChildren: true,
                },
                {
                  id: 9,
                  aggFunc: 'sumUsages',
                  cellRenderer: 'agUsageCellRenderer',
                  headerName: 'Servicing',
                  initialWidth: 130,
                },
              ],
              groupId: 'usage_refrigeration',
              headerClass: 'ag-text-center',
              headerGroupComponent: 'agColumnHeaderGroup',
              headerName: 'Refrigeration',
              initialWidth: 140,
              marryChildren: true,
            },
            {
              id: 10,
              aggFunc: 'sumUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Solvent',
              initialWidth: 130,
            },
            {
              id: 'total_usages',
              aggFunc: 'sumUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'TOTAL',
              initialWidth: 130,
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
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'manufacturing_blends',
          headerName: 'Manufacturing of Blends',
          initialWidth: 250,
        },
        {
          aggFunc: 'sum',
          cellRenderer: 'agFloatCellRenderer',
          field: 'import_quotas',
          headerName: 'Import Quotas',
          initialWidth: 150,
        },
        {
          cellRenderer: 'agDateCellRenderer',
          field: 'banned_date',
          headerName: 'Date ban commenced (DD/MM/YYYY)',
          initialWidth: 200,
        },
        {
          field: 'remarks',
          headerName: 'Remarks',
          initialWidth: 300,
        },
      ],
      defaultColDef: {
        cellClass: 'ag-text-right',
        headerClass: 'ag-text-center',
        minWidth: 130,
        resizable: true,
      },
    }),
    [],
  )

  return gridOptions
}

export function getIncludedSubstances(model: string) {
  const includedSubstances: Record<string, any> = {
    IV: [
      103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 114, 115, 116, 117, 118,
      119, 120, 121, 122, 123,
    ],
  }
  return includedSubstances[model]
}

export default useGridOptions
