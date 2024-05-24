import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import { ColDef } from 'ag-grid-community/dist/types/main'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefById } from '../sectionColumnsDef'

function useGridOptions(props: { model: string; usages: Array<any> }) {
  const { model, usages } = props

  const usagesDiff = usages.map(function (item) {
    const itemDiff = { ...item }
    const children: Record<string, any>[] = itemDiff?.children
    if (!!children) {
      const childrenDiff = children.map(function (child) {
        const childDiff = { ...child }
        childDiff.category = 'usage_diff'

        const childChildren: Record<string, any>[] = childDiff?.children
        if (!!childChildren) {
          const childChildrenDiff = childChildren.map(function (childChild) {
            const childChildDiff = { ...childChild }
            childChildDiff.category = 'usage_diff'
            return childChildDiff
          })
          childDiff.children = childChildrenDiff
        }

        return childDiff
      })
      itemDiff.children = childrenDiff
    }
    itemDiff.category = 'usage_diff'
    return itemDiff
  })

  const substanceColumn = useCallback(
    (extra?: ColDef) => ({
      cellClass: (props: CellClassParams) => {
        return cx('flex items-center w-full', {
          'ag-text-center': props.data?.change_type,
        })
      },
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
        return cx('px-0', {
          'ag-cell-hashed theme-dark:bg-gray-900/40':
            includes(props.data?.excluded_usages || [], props.colDef.id) ||
            (props.column.getColId() === 'manufacturing_blends' &&
              includes(['V'], model) &&
              props.data?.substance_id &&
              !parseFloat(props.value)) ||
            (props.column.getColId() === 'production' &&
              includes(['V'], model) &&
              props.data?.blend_id &&
              !parseFloat(props.value)),
          'ag-text-center': !includes(['display_name'], props.colDef.field),
        })
      },
      headerClass: 'ag-text-center',
      // minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    }),
    [model],
  )

  const bySector = useMemo(() => {
    return [
      ...usagesDiff,
      {
        id: 'total_usages',
        category: 'usage_diff',
        cellClass: 'bg-yellow-50 text-center px-0',
        headerName: 'TOTAL',
        orsAggFunc: 'sumTotalUsages',
        ...sectionColDefById['total_usages'],
      },
    ]
  }, [usagesDiff])

  const bySubstanceTrade = useCallback(() => {
    return [
      {
        ...sectionColDefById['imports'],
        dataType: 'number_diff',
        field: 'imports',
        headerName: 'Import',
        orsAggFunc: 'sumTotal',
        // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
      },
      {
        ...sectionColDefById['exports'],
        dataType: 'number_diff',
        field: 'exports',
        headerName: 'Export',
        orsAggFunc: 'sumTotal',
        // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
      },
      {
        ...sectionColDefById['production'],
        dataType: 'number_diff',
        field: 'production',
        headerName: 'Production',
        orsAggFunc: 'sumTotal',
        // ...(standalone ? { flex: 1 } : { initialWidth: 100, maxWidth: 100 }),
      },
      ...(includes(['V'], model)
        ? [
            {
              ...sectionColDefById['manufacturing_blends'],
              dataType: 'number_diff',
              field: 'manufacturing_blends',
              headerName: 'Manufacturing of Blends',
              orsAggFunc: 'sumTotal',
              // ...(standalone
              //   ? { flex: 1 }
              //   : { initialWidth: 110, minWidth: 110 }),
            },
          ]
        : []),
      ...(includes(['II', 'III', 'IV', 'V'], model)
        ? [
            {
              ...sectionColDefById['import_quotas'],
              dataType: 'number_diff',
              field: 'import_quotas',
              headerName: 'Import Quotas',
              orsAggFunc: 'sumTotal',
              // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
            },
          ]
        : []),
      {
        ...sectionColDefById['banned_date'],
        dataType: 'date',
        field: 'banned_date',
        // ...(standalone ? { flex: 1 } : { initialWidth: 110, maxWidth: 110 }),
      },
    ]
  }, [model])

  const gridOptionsAll: GridOptions = useMemo(() => {
    return {
      columnDefs: [
        substanceColumn(),
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
      columnDefs: [substanceColumn(), ...bySubstanceTrade()],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySubstanceTrade, substanceColumn, defaultSectionColDef])

  const gridOptionsBySector: GridOptions = useMemo(() => {
    return {
      columnDefs: [substanceColumn(), ...bySector],
      defaultColDef: defaultSectionColDef,
    }
  }, [bySector, substanceColumn, defaultSectionColDef])

  return { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade }
}

export default useGridOptions
