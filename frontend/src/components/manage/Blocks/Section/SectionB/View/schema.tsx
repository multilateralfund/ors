import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import { ColDef } from 'ag-grid-community/dist/lib/main'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefById } from '../sectionColumnsDef'

function useGridOptions(props: { model: string; usages: Array<any> }) {
  const { model, usages } = props

  const substanceColumn = useCallback(
    (extra: ColDef) => ({
      ...sectionColDefById['display_name'],
      field: 'display_name',
      headerClass: 'ag-text-left',
      headerName: 'Substance',
      ...extra,
    }),
    [],
  )

  const defaultSectionColDef = useMemo(
    () => ({
      autoHeight: true,
      cellClass: (props: CellClassParams) => {
        return cx({
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
        cellClass: 'bg-yellow-50 text-right',
        headerName: 'TOTAL',
        orsAggFunc: 'sumTotalUsages',
        ...sectionColDefById['total_usages'],
      },
    ]
  }, [usages])

  const bySubstanceTrade = useCallback(
    (standalone = false) => {
      return [
        {
          ...sectionColDefById['imports'],
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['exports'],
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['production'],
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        ...(includes(['V'], model)
          ? [
              {
                ...sectionColDefById['manufacturing_blends'],
                dataType: 'number',
                field: 'manufacturing_blends',
                headerName: 'Manufacturing of Blends',
                orsAggFunc: 'sumTotal',
                ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                ...sectionColDefById['import_quotas'],
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                orsAggFunc: 'sumTotal',
                ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        {
          ...sectionColDefById['banned_date'],
          dataType: 'date',
          field: 'banned_date',
          ...(standalone ? { flex: 1 } : { flex: 1.2 }),
        },
        {
          ...sectionColDefById['remarks'],
          field: 'remarks',
          headerName: 'Remarks',
          ...(standalone ? { flex: 1 } : { flex: 1.2 }),
        },
      ]
    },
    [model],
  )

  const gridOptionsAll: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        substanceColumn({ initialWidth: 430 }),
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
        ...bySubstanceTrade(),
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
      columnDefs: [
        substanceColumn({ initialWidth: 430 }),
        ...bySubstanceTrade(true),
      ],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySubstanceTrade, substanceColumn, defaultSectionColDef])

  const gridOptionsBySector: GridOptions = useMemo(() => {
    return {
      columnDefs: [substanceColumn({ initialWidth: 430 }), ...bySector],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySector, substanceColumn, defaultSectionColDef])

  return { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade }
}

export default useGridOptions
