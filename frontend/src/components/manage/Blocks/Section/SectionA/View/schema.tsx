import { useMemo } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefById } from '../sectionColumnsDef'

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
          ...sectionColDefById['display_name'],
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
                    ...sectionColDefById['total_usages'],
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
          ...sectionColDefById['imports'],
        },
        {
          aggFunc: 'sumTotal',
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          ...sectionColDefById['exports'],
        },
        {
          aggFunc: 'sumTotal',
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          ...sectionColDefById['production'],
        },
        ...(includes(['IV', 'V'], model)
          ? [
              {
                aggFunc: 'sumTotal',
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                ...sectionColDefById['import_quotas'],
              },
            ]
          : []),
        ...(includes(['IV', 'V'], model)
          ? [
              {
                dataType: 'date',
                field: 'banned_date',
                headerName: 'Date ban commenced (DD/MM/YYYY)',
                ...sectionColDefById['banned_date'],
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                cellClass: 'ag-text-left',
                field: 'remarks',
                headerName: 'Remarks',
                ...sectionColDefById['remarks'],
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
          }
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
