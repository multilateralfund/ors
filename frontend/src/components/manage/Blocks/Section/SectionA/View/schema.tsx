import { useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefById } from '../sectionColumnsDef'

function useGridOptions(props: { model: string; usages: object[] }) {
  const { model, usages } = props

  const substanceColumn = useMemo(
    () => ({
      field: 'display_name',
      headerClass: 'ag-text-left',
      headerName: 'Substance',
      ...sectionColDefById['display_name'],
      editable: false,
    }),
    [],
  )

  const defaultSectionColDef = useMemo(
    () => ({
      autoHeight: true,
      cellClass: (props: CellClassParams) => {
        return cx({
          'ag-cell-hashed theme-dark:bg-gray-900/40': includes(
            props.data.excluded_usages || [],
            props.colDef.id,
          ),
          'ag-text-right': !includes(['display_name'], props.colDef.field),
        })
      },
      headerClass: 'ag-text-center',
      minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    }),
    [],
  )

  const bySector = useMemo(() => {
    return [
      ...usages,
      {
        id: 'total_usages',
        category: 'usage',
        headerName: 'TOTAL',
        orsAggFunc: 'sumTotalUsages',
        ...sectionColDefById['total_usages'],
      },
    ]
  }, [usages])

  const bySubstanceTrade = useMemo(() => {
    return [
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
      ...(includes(['II', 'III', 'IV', 'V'], model)
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
      ...(includes(['II', 'III'], model)
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
              headerName: 'If imports are banned, indicate date ban commenced',
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
    ]
  }, [model])

  const gridOptionsAll: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        substanceColumn,
        ...(usages.length
          ? [
              {
                children: bySector,
                headerGroupComponent: 'agColumnHeaderGroup',
                headerName: 'Use by Sector',
                marryChildren: true,
              },
            ]
          : []),
        ...bySubstanceTrade,
      ],
      defaultColDef: defaultSectionColDef,
    }
  }, [
    bySector,
    substanceColumn,
    bySubstanceTrade,
    usages,
    defaultSectionColDef,
  ])

  const gridOptionsBySubstanceTrade: GridOptions = useMemo(() => {
    return {
      columnDefs: [substanceColumn, ...bySubstanceTrade],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySubstanceTrade, substanceColumn, defaultSectionColDef])

  const gridOptionsBySector: GridOptions = useMemo(() => {
    return {
      columnDefs: [substanceColumn, ...bySector],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySector, substanceColumn, defaultSectionColDef])

  return { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade }
}

export default useGridOptions
