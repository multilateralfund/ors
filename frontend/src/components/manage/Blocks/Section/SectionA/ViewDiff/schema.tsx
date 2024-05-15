import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'

function useGridOptions(props: { model: string; usages: Record<string, any>[] }) {
  const { model, usages } = props
  const usagesDiff = usages.map(function(item) {
    const itemDiff = { ...item }
    const children: Record<string, any>[] = itemDiff?.children
    if (!!children) {
      const childrenDiff = children.map(function(child) {
        const childDiff = { ...child }
        childDiff.category='usage_diff'
        return childDiff
      })
      itemDiff.children = childrenDiff
    }
    itemDiff.category = 'usage_diff'
    return itemDiff
  })

  const sectionColDefById = sectionColDefByIdFunc(model)

  const substanceColumn = useMemo(
    () => ({
      field: 'display_name',
      headerClass: 'ag-text-left',
      headerName: 'Substance',
      ...sectionColDefById['display_name'],
      editable: false,
      ...(includes(['I', 'II', 'III'], model) ? { initialWidth: 165 } : {}),
    }),
    [model, sectionColDefById],
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
          'ag-text-center': !includes(['display_name'], props.colDef.field),
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
      ...usagesDiff,
      {
        id: 'total_usages',
        category: 'usage_diff',
        cellClass: 'bg-yellow-50 text-center',
        headerName: 'TOTAL',
        orsAggFunc: 'sumTotalUsages',
        ...sectionColDefById['total_usages'],
      },
    ]
  }, [usages, sectionColDefById])

  const bySubstanceTrade = useCallback(
    (standalone = false) => {
      return [
        {
          ...sectionColDefById['imports'],
          dataType: 'number_diff',
          field: 'imports',
          headerName: 'Import',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['exports'],
          dataType: 'number_diff',
          field: 'exports',
          headerName: 'Export',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['production'],
          dataType: 'number_diff',
          field: 'production',
          headerName: 'Production',
          orsAggFunc: 'sumTotal',
          ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                ...sectionColDefById['import_quotas'],
                dataType: 'number_diff',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                orsAggFunc: 'sumTotal',
                ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        ...(includes(['I', 'II', 'III'], model)
          ? [
              {
                ...sectionColDefById['export_quotas'],
                dataType: 'number_diff',
                field: 'export_quotas',
                headerName: 'Export Quotas',
                orsAggFunc: 'sumTotal',
                ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        ...(includes(['IV', 'V'], model)
          ? [
              {
                ...sectionColDefById['banned_date'],
                dataType: 'date',
                field: 'banned_date',
                ...(standalone ? { flex: 1 } : { flex: 1 }),
              },
            ]
          : []),
        ...(includes(['II', 'III', 'IV', 'V'], model)
          ? [
              {
                ...sectionColDefById['remarks'],
                cellClass: 'ag-text-left',
                field: 'remarks',
                headerName: 'Remarks',
                ...(standalone ? { flex: 1 } : { flex: 1 }),
              },
            ]
          : []),
      ]
    },
    [model, sectionColDefById],
  )

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
      columnDefs: [substanceColumn, ...bySubstanceTrade(true)],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySubstanceTrade, substanceColumn, defaultSectionColDef])

  const gridOptionsBySector: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        {
          ...substanceColumn,
        },
        ...bySector,
      ],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySector, substanceColumn, defaultSectionColDef])

  return { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade }
}

export default useGridOptions
