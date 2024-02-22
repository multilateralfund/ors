import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

function useGridOptions(props: { model: string; usages: object[] }) {
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
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          ...colDefById['imports'],
        },
        {
          aggFunc: 'sumTotal',
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          ...colDefById['exports'],
        },
        {
          aggFunc: 'sumTotal',
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          ...colDefById['production'],
        },
        ...(includes(['IV', 'V'], model)
          ? [
              {
                aggFunc: 'sumTotal',
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                ...colDefById['import_quotas'],
              },
            ]
          : []),
        ...(includes(['IV', 'V'], model)
          ? [
              {
                dataType: 'date',
                field: 'banned_date',
                headerName: 'Date ban commenced (DD/MM/YYYY)',
                ...colDefById['banned_date'],
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                cellClass: 'ag-text-left',
                field: 'remarks',
                headerName: 'Remarks',
                ...colDefById['remarks'],
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
        cellRendererParams: () => {
          return {
            maximumFractionDigits: 2,
          };
        },
        headerClass: 'ag-text-center',
        minWidth: defaultColDef.minWidth,
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
