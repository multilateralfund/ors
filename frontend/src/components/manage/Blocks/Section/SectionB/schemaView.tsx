import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

function useGridOptions() {
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
              children: [
                {
                  id: 5,
                  children: [
                    {
                      id: 6,
                      aggFunc: 'sumTotalUsages',
                      cellRenderer: 'agUsageCellRenderer',
                      headerName: 'Other',
                      initialWidth: 130,
                    },
                    {
                      id: 7,
                      aggFunc: 'sumTotalUsages',
                      cellRenderer: 'agUsageCellRenderer',
                      headerName: 'AC',
                      initialWidth: 130,
                    },
                    {
                      id: 'total_refrigeration',
                      aggFunc: 'sumTotalUsages',
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
                  aggFunc: 'sumTotalUsages',
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
              aggFunc: 'sumTotalUsages',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Solvent',
              initialWidth: 130,
            },
            {
              id: 'total_usages',
              aggFunc: 'sumTotalUsages',
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
        {
          aggFunc: 'sumTotal',
          cellRenderer: 'agFloatCellRenderer',
          field: 'manufacturing_blends',
          headerName: 'Manufacturing of Blends',
          initialWidth: 250,
        },
        {
          aggFunc: 'sumTotal',
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
        autoHeight: true,
        cellClass: 'ag-text-right',
        headerClass: 'ag-text-center',
        minWidth: 130,
        resizable: true,
        wrapText: true,
      },
    }),
    [],
  )

  return gridOptions
}

export default useGridOptions
