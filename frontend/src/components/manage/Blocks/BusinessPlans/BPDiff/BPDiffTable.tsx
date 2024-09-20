'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import { Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { reduce } from 'lodash'
import { useParams } from 'next/navigation'

import {
  BPDataInterface,
  BpPathParams,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import TableDateSwitcher, {
  TableDataSelectorValuesType,
} from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import Table from '@ors/components/manage/Form/Table'
import DiffTooltipHeader from '@ors/components/ui/DiffUtils/DiffTooltipHeader'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { debounce } from '@ors/helpers/Utils/Utils'

import {
  allColumnDefs,
  commentsColumnDefs,
  odpColumnDefs,
  valuesColumnDefs,
} from './diffSchema'

const BP_PER_PAGE = 20

export default function BPDiffTable({
  diffData,
}: {
  diffData: BPDataInterface
}) {
  const form = useRef<any>()
  const params = useParams<BpPathParams>()

  const { period } = params
  const year_start = period.split('-')[0]

  // const { setParams } = useContext(BPContext) as any
  const { yearRanges } = useContext(BPYearRangesContext) as any

  const { loaded, loading, results } = diffData || {}

  // const results = [
  //   {
  //     id: 20644,
  //     amount_polyol: null,
  //     amount_polyol_old: null,
  //     bp_chemical_type: {
  //       id: 1,
  //       name: 'HCFC',
  //     },

  //     bp_chemical_type_id: 1,
  //     bp_chemical_type_old: {
  //       id: 1,
  //       name: 'HCFC',
  //     },
  //     change_type: 'changed',
  //     comment_secretariat: '',
  //     comment_secretariat_old: '',
  //     comment_types: [],
  //     comment_types_old: [],
  //     country: {
  //       id: 202,
  //       abbr: 'TZ',
  //       has_cp_report: null,
  //       is_a2: false,
  //       iso3: 'TZA',
  //       name: 'United Republic of Tanzania',
  //       name_alt: 'Tanzania',
  //     },
  //     country_id: 14,
  //     country_old: {
  //       id: 14,
  //       abbr: 'AF',
  //       has_cp_report: null,
  //       is_a2: false,
  //       iso3: 'AFG',
  //       name: 'Afghanistan',
  //       name_alt: 'Afghanistan',
  //     },
  //     // country_old: {
  //     //   id: 202,
  //     //   abbr: 'TZ',
  //     //   has_cp_report: null,
  //     //   is_a2: false,
  //     //   iso3: 'TZA',
  //     //   name: 'United Republic of Tanzania',
  //     //   name_alt: 'Tanzania',
  //     // },
  //     initial_id: null,
  //     is_multi_year: true,
  //     is_multi_year_display: 'Multi-Year',
  //     is_multi_year_old: true,
  //     is_updated: false,
  //     legacy_sector_and_subsector: 'HPMP Stage I',
  //     legacy_sector_and_subsector_old:
  //       'Stage 2 - HCFC Phase-out Management Plan (implementation) ',
  //     lvc_status: 'Non-LVC',
  //     // legacy_sector_and_subsector_old: 'HPMP Stage I',
  //     lvc_status_old: 'LVC',
  //     project_cluster: {
  //       id: 28,
  //       category: 'BOTH',
  //       code: 'INS',
  //       name: 'INS',
  //       sort_order: 27,
  //     },
  //     project_cluster_id: 28,
  //     // lvc_status_old: 'Non-LVC',
  //     project_cluster_old: {
  //       id: 19,
  //       category: 'IND',
  //       code: 'CFCIND',
  //       name: 'CFC Individual',
  //       sort_order: 18,
  //     },
  //     // project_cluster_old: {
  //     //   id: 28,
  //     //   category: 'BOTH',
  //     //   code: 'INS',
  //     //   name: 'INS',
  //     //   sort_order: 27,
  //     // },
  //     project_type: {
  //       id: 10,
  //       code: 'PHA',
  //       name: 'Phase Out',
  //       sort_order: 22,
  //     },
  //     project_type_id: 10,
  //     project_type_old: {
  //       id: 10,
  //       code: 'PHA',
  //       name: 'Phase Out',
  //       sort_order: 22,
  //     },
  //     reason_for_exceeding: null,
  //     reason_for_exceeding_old: null,
  //     remarks: null,
  //     remarks_additional: null,
  //     remarks_additional_old: null,
  //     remarks_old: 'UN sanctions and the security situation is challenging',
  //     // remarks_old: null,
  //     required_by_model: 'Approved Multi-Year',
  //     required_by_model_old: 'Approved Multi-Year',
  //     sector: {
  //       id: 24,
  //       code: 'TAS',
  //       name: 'Technical Assistance',
  //       sort_order: 30,
  //     },
  //     sector_old: null,
  //     // sector_old: {
  //     //   id: 24,
  //     //   code: 'TAS',
  //     //   name: 'Technical Assistance',
  //     //   sort_order: 30,
  //     // },
  //     status: 'A',
  //     status_display: 'Approved',
  //     status_display_old: 'Approved',
  //     status_old: 'A',
  //     subsector: {
  //       id: 25,
  //       code: 'FXS',
  //       name: 'Fixed system',
  //       sector_id: 3,
  //       sort_order: 2,
  //     },
  //     subsector_old: null,
  //     // subsector_old: {
  //     //   id: 25,
  //     //   code: 'FXS',
  //     //   name: 'Fixed system',
  //     //   sector_id: 3,
  //     //   sort_order: 2,
  //     // },
  //     substances_display: ['HCFC-22'],
  //     substances_display_old: [],
  //     // substances_display_old: [],
  //     substances_old: [],
  //     title: '-',
  //     title_old: 'Afghanistan HPMP implementation  (Stage II)',
  //     values: [
  //       {
  //         is_after: false,
  //         value_mt: '924.965000000000000',
  //         value_mt_old: null,
  //         value_odp: '2.180000000000000',
  //         value_odp_old: null,
  //         value_usd: '215.265000000000000',
  //         value_usd_old: null,
  //         year: 2023,
  //       },
  //       {
  //         is_after: false,
  //         value_mt: '19.277468388147515',
  //         value_mt_old: '924.965000000000000',
  //         value_odp: '2.180000000000000',
  //         value_odp_old: '2.180000000000000',
  //         value_usd: '15.265000000000000',
  //         value_usd_old: '215.265000000000000',
  //         year: 2024,
  //       },
  //       {
  //         is_after: false,
  //         value_mt: '19.277468388147515',
  //         value_mt_old: '924.965000000000000',
  //         value_odp: '2.180000000000000',
  //         value_odp_old: '2.180000000000000',
  //         value_usd: '15.265000000000000',
  //         value_usd_old: '215.265000000000000',
  //         year: 2025,
  //       },
  //       {
  //         is_after: true,
  //         value_mt: '19.277468388147515',
  //         value_mt_old: '924.965000000000000',
  //         value_odp: '2.180000000000000',
  //         value_odp_old: '2.180000000000000',
  //         value_usd: '15.265000000000000',
  //         value_usd_old: '215.265000000000000',
  //         year: 2025,
  //       },
  //     ],
  //   },
  // ]

  // aici
  const count = results?.length || 0
  const yearRangeSelected = useMemo(
    () => yearRanges.find((item: any) => item.year_start == year_start),
    [yearRanges, year_start],
  )

  const valuesCellRenderer = (props: any) => {
    const { new_value, old_value } = props.value

    return new_value === old_value ? (
      <span className="whitespace-nowrap font-semibold ">{new_value}</span>
    ) : (
      <Tooltip
        enterDelay={300}
        placement={'top'}
        title={<DiffTooltipHeader {...{ new_value, old_value }} />}
      >
        <Typography className="diff-cell-new flex flex-col" component="span">
          <span className="whitespace-nowrap font-semibold ">
            {new_value === '' ? '-' : new_value}
          </span>
          <span className="diff-old-value col-start-2 row-start-2 whitespace-nowrap">
            {old_value === '' ? '-' : old_value}
          </span>
        </Typography>
      </Tooltip>
    )
  }

  const getYearColsValue = (
    value: any,
    year: number,
    isAfterMaxYear: boolean,
  ) =>
    isAfterMaxYear ? value.is_after : value.year === year && !value.is_after

  const yearColumns = useMemo(() => {
    if (!yearRangeSelected) return []

    const valuesUSD = []
    const valuesODP = []
    const valuesMT = []

    for (
      let year = yearRangeSelected.min_year;
      year <= yearRangeSelected.max_year + 1;
      year++
    ) {
      const isAfterMaxYear = year > yearRangeSelected.max_year

      let label = year
      if (isAfterMaxYear) {
        label = `After ${yearRangeSelected.max_year}`
      }

      const valuesCellGetter = (params: any, colIdentifier: string) => {
        const value = params.data.values.find((value: any) =>
          getYearColsValue(value, year, isAfterMaxYear),
        )
        const new_val = value?.[colIdentifier]
        const old_val = value?.[colIdentifier + '_old']

        return {
          new_value: new_val ? parseFloat(new_val).toFixed(2) : '',
          old_value: old_val ? parseFloat(old_val).toFixed(2) : '',
        }
      }

      valuesUSD.push({
        autoHeaderHeight: true,
        autoHeight: true,
        cellClass: 'ag-text-center',
        cellRenderer: valuesCellRenderer,
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        resizable: true,
        valueGetter: (params: any) => valuesCellGetter(params, 'value_usd'),
      }),
        valuesODP.push({
          autoHeaderHeight: true,
          autoHeight: true,
          cellClass: 'ag-text-center',
          cellRenderer: valuesCellRenderer,
          field: `value_odp_${year}`,
          headerClass: 'ag-text-center',
          headerName: `${label}`,
          minWidth: 80,
          resizable: true,
          valueGetter: (params: any) => valuesCellGetter(params, 'value_odp'),
        })

      valuesMT.push({
        autoHeaderHeight: true,
        autoHeight: true,
        cellClass: 'ag-text-center',
        cellRenderer: valuesCellRenderer,
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        resizable: true,
        valueGetter: (params: any) => valuesCellGetter(params, 'value_mt'),
      })
    }

    return [
      {
        children: valuesUSD,
        headerName: 'Value ($000)',
      },
      {
        children: valuesODP,
        headerName: 'ODP',
      },
      {
        children: valuesMT,
        headerName: 'MT for HFC',
      },
    ]
  }, [yearRangeSelected])

  const [gridOptions, setGridOptions] =
    useState<TableDataSelectorValuesType>('all')

  const columnDefs = useMemo(() => {
    switch (gridOptions) {
      case 'values':
        return valuesColumnDefs(yearColumns)
      case 'odp':
        return odpColumnDefs(yearColumns)
      case 'comments':
        return commentsColumnDefs()
      default:
        return allColumnDefs(yearColumns)
    }
  }, [gridOptions, yearColumns])

  const displayFilters = () => {
    return (
      <div className="bp-table-toolbar mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex gap-4 self-start">
          <TableDateSwitcher
            changeHandler={(event, value) => setGridOptions(value)}
            value={gridOptions}
          />
        </div>
      </div>
    )
  }

  const getPaginationSelectorOpts = (): number[] => {
    const nrResultsOpts = [10, 20, 50, 100]
    const filteredNrResultsOptions = nrResultsOpts.filter(
      (option) => option < count,
    )
    return [...filteredNrResultsOptions, count]
  }
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts()

  const grid = useRef<any>()

  const autoSizeColumns = () => {
    if (!grid.current.api) return
    grid.current.api.autoSizeColumns(
      reduce(
        columnDefs,
        (acc: Array<string>, column) => {
          acc.push(column.field)
          return acc
        },
        [],
      ),
    )
  }

  return (
    yearRanges &&
    yearRanges.length > 0 && (
      <form ref={form}>
        <Table
          className="bp-diff-table"
          Toolbar={displayFilters}
          columnDefs={[...columnDefs]}
          domLayout="normal"
          enablePagination={true}
          gridRef={grid}
          loaded={loaded}
          loading={loading}
          paginationPageSize={BP_PER_PAGE}
          paginationPageSizeSelector={paginationPageSizeSelectorOpts}
          rowBuffer={50}
          rowCount={count}
          rowData={results}
          rowsVisible={20}
          tooltipShowDelay={200}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onFirstDataRendered={() => {
            debounce(autoSizeColumns, 0)
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            // setParams({
            //   limit: rowsPerPage,
            //   offset: page * rowsPerPage,
            // })
            debounce(autoSizeColumns, 0)
          }}
          onRowDataUpdated={() => {
            debounce(autoSizeColumns, 0)
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                (column) =>
                  (column.sort === 'asc' ? '' : '-') +
                  column.colId.replaceAll('.', '__'),
              )
              .join(',')
            // setParams({ offset: 0, ordering })
          }}
        />
      </form>
    )
  )
}
