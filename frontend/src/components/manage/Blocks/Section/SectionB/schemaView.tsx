import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        field: 'chemical_name',
        headerName: 'Substance',
        minWidth: 200,
      },
      {
        children: [
          {
            id: 1,
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Aerosol',
            minWidth: 100,
          },
          {
            id: 2,
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Foam',
            minWidth: 100,
          },
          {
            id: 3,
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Fire fighting',
            minWidth: 130,
          },
          {
            id: 4,
            children: [
              {
                id: 5,
                children: [
                  {
                    id: 7,
                    aggFunc: 'sumUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'AC',
                    minWidth: 80,
                  },
                  {
                    id: 6,
                    aggFunc: 'sumUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Other',
                    minWidth: 80,
                  },
                  {
                    id: 8,
                    aggFunc: 'sumUsages',
                    cellRenderer: 'agUsageCellRenderer',
                    headerName: 'Total',
                    minWidth: 80,
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
                minWidth: 110,
              },
            ],
            groupId: 'usage_refrigeration',
            headerClass: 'ag-text-center',
            headerGroupComponent: 'agColumnHeaderGroup',
            headerName: 'Refrigeration and air-conditioning',
            marryChildren: true,
          },
          {
            id: 10,
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Solvent',
            minWidth: 120,
          },
          {
            id: 12,
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'Other',
            minWidth: 80,
          },
          {
            id: 'total',
            aggFunc: 'sumUsages',
            cellRenderer: 'agUsageCellRenderer',
            headerName: 'TOTAL',
            minWidth: 80,
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
        headerName: 'Imports',
        minWidth: 100,
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'exports',
        headerName: 'Exports',
        minWidth: 100,
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'production',
        headerName: 'Production',
        minWidth: 120,
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'manufacturing_blends',
        headerName: 'Manufacturing of Blends',
        minWidth: 220,
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'import_quotas',
        headerName: 'Import Quotas',
        minWidth: 150,
      },
      {
        cellRenderer: 'agDateCellRenderer',
        field: 'banned_date',
        headerName: 'Date ban commenced (DD/MM/YYYY)',
        minWidth: 200,
      },
      {
        field: 'remarks',
        headerName: 'Remarks',
        minWidth: 300,
      },
    ],
    defaultColDef: {
      flex: 1,
      minWidth: 140,
      resizable: true,
    },
  })

  return gridOptions
}

export default useGridOptions
