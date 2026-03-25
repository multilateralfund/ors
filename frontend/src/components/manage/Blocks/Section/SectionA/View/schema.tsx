import { useCallback, useMemo } from 'react'

import { CellClassParams, GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

function useGridOptions(props: { variant: ReportVariant; usages: object[] }) {
  const { variant, usages } = props

  const sectionColDefById = sectionColDefByIdFunc(variant)

  const substanceColumn = useMemo(
    () => ({
      field: 'display_name',
      headerClass: 'ag-text-left',
      headerName: 'Substance',
      ...sectionColDefById['display_name'],
      editable: false,
      // ...(variant.match([CPModel.I, CPModel.II, CPModel.III]) ? { initialWidth: 165 } : {}),
    }),
    [sectionColDefById],
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
      // minWidth: defaultColDef.minWidth,
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
          dataType: 'number',
          field: 'imports',
          headerName: 'Import',
          orsAggFunc: 'sumTotal',
          // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['exports'],
          dataType: 'number',
          field: 'exports',
          headerName: 'Export',
          orsAggFunc: 'sumTotal',
          // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
        {
          ...sectionColDefById['production'],
          dataType: 'number',
          field: 'production',
          headerName: 'Production',
          orsAggFunc: 'sumTotal',
          // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
        },
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
                dataType: 'number',
                field: 'import_quotas',
                headerName: 'Import Quotas',
                orsAggFunc: 'sumTotal',
                // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        ...(variant.match([CPModel.I, CPModel.II, CPModel.III])
          ? [
              {
                ...sectionColDefById['export_quotas'],
                dataType: 'number',
                field: 'export_quotas',
                headerName: 'Export Quotas',
                orsAggFunc: 'sumTotal',
                // ...(standalone ? { flex: 1 } : { flex: 0.5 }),
              },
            ]
          : []),
        ...(variant.match([CPModel.IV, CPModel.V, CPModel.VI])
          ? [
              {
                ...sectionColDefById['banned_date'],
                dataType: 'date',
                field: 'banned_date',
                // ...(standalone ? { flex: 1 } : { flex: 1 }),
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
                ...sectionColDefById['remarks'],
                field: 'remarks',
                headerName: 'Remarks',
                // ...(standalone ? { flex: 1 } : { flex: 1 }),
              },
            ]
          : []),
      ]
    },
    [variant, sectionColDefById],
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
