import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import { ColDef } from 'ag-grid-community/dist/types/main'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefById } from '../sectionColumnsDef'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

function useGridOptions(props: { variant: ReportVariant; usages: Array<any> }) {
  const { variant, usages } = props

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
      cellClass: 'flex items-center w-full',
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
              variant.match([CPModel.V, CPModel.VI]) &&
              props.data?.substance_id &&
              !parseFloat(props.value)) ||
            (props.column.getColId() === 'production' &&
              variant.match([CPModel.V, CPModel.VI]) &&
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
    [variant],
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
      ...(variant.match([CPModel.V, CPModel.VI])
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
      ...(variant.match([
        CPModel.II,
        CPModel.III,
        CPModel.IV,
        CPModel.V,
        CPModel.VI,
      ])
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
        dataType: 'date_diff',
        field: 'banned_date',
        // ...(standalone ? { flex: 1 } : { initialWidth: 110, maxWidth: 110 }),
      },
      {
        ...sectionColDefById['remarks'],
        cellClass: 'ag-text-left remarks-cell',
        dataType: 'text_diff',
        field: 'remarks',
        headerName: 'Remarks',
        // ...(standalone ? { flex: 1 } : { initialWidth: 80, maxWidth: 80 }),
      },
    ]
  }, [variant])

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
