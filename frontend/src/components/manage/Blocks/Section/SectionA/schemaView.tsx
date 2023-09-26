import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'

function cellClass(props: any) {
  if (props.data.isGroup) {
    return 'ag-row-group'
  }
  if (props.data.isSubTotal) {
    return 'ag-row-sub-total'
  }
  if (props.data.isTotal) {
    return 'ag-row-total'
  }
  return ''
}

function useGridOptions() {
  const gridOptions: GridOptions = useMemo(() => {
    return {
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
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Aerosol',
              minWidth: 100,
            },
            {
              id: 2,
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Foam',
              minWidth: 100,
            },
            {
              id: 3,
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Fire fighting',
              minWidth: 130,
            },
            {
              id: 4,
              children: [
                {
                  id: 5,
                  cellRenderer: 'agUsageCellRenderer',
                  headerName: 'Manufacturing',
                  minWidth: 150,
                },
                {
                  id: 9,
                  cellRenderer: 'agUsageCellRenderer',
                  headerName: 'Servicing',
                  minWidth: 150,
                },
              ],
              groupId: 'usage_refrigeration',
              headerClass: 'text-center',
              headerGroupComponent: 'agColumnHeaderGroup',
              headerName: 'Refrigeration',
              marryChildren: true,
            },
            {
              id: 10,
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Solvent',
              minWidth: 120,
            },
            {
              id: 13,
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Process agent',
              minWidth: 150,
            },
            {
              id: 15,
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'Lab use',
              minWidth: 110,
            },
            {
              id: 16,
              children: [
                {
                  id: 17,
                  cellRenderer: 'agUsageCellRenderer',
                  headerName: 'QPS',
                  minWidth: 110,
                },
                {
                  id: 18,
                  cellRenderer: 'agUsageCellRenderer',
                  headerName: 'Non-QPS',
                  minWidth: 110,
                },
              ],
              groupId: 'usage_methyl_bromide',
              headerClass: 'text-center',
              headerGroupComponent: 'agColumnHeaderGroup',
              headerName: 'Methyl bromide',
              marryChildren: true,
            },
            {
              id: 'total',
              cellRenderer: 'agUsageCellRenderer',
              headerName: 'TOTAL',
              minWidth: 140,
            },
          ],
          groupId: 'usages',
          headerClass: 'text-center',
          headerGroupComponent: 'agColumnHeaderGroup',
          headerName: 'Use by Sector',
          marryChildren: true,
        },
        {
          cellRenderer: 'agFloatCellRenderer',
          field: 'imports',
          headerName: 'Imports',
          minWidth: 100,
        },
        {
          cellRenderer: 'agFloatCellRenderer',
          field: 'exports',
          headerName: 'Exports',
          minWidth: 100,
        },
        {
          cellRenderer: 'agFloatCellRenderer',
          field: 'production',
          headerName: 'Production',
          minWidth: 120,
        },
        {
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
        cellClass,
        flex: 1,
        minWidth: 140,
      },
    }
  }, [])

  return gridOptions
}

export default useGridOptions
