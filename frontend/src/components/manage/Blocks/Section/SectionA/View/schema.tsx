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
                    category: 'usage',
                    headerName: 'TOTAL',
                    orsAggFunc: 'sumTotalUsages',
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
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['imports'],
        },
        {
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['exports'],
        },
        {
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          orsAggFunc: 'sumTotal',
          ...sectionColDefById['production'],
        },
        ...(includes(['III', 'IV', 'V'], model)
          ? [
              {
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['import_quotas'],
              },
            ]
          : []),
        ...(includes(['III', 'IV'], model)
          ? [
              {
                dataType: 'number',
                field: 'export_quotas',
                headerName: 'Export Quotas',
                orsAggFunc: 'sumTotal',
                ...sectionColDefById['export_quotas'],
              },
            ]
          : []),
        ...(includes(['IV', 'V'], model)
          ? [
              {
                dataType: 'date',
                field: 'banned_date',
                headerName:
                  'If imports are banned, indicate date ban commenced',
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
