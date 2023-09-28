import { useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { each, groupBy, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import { getResults } from '@ors/helpers/Api/Api'
import useStore from '@ors/store'

import useGridOptions, { getIncludedSubstances } from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionAView(props: {
  report: Record<string, Array<any>>
  variant: any
}) {
  const { report } = props
  const variant = { model: 'IV' }
  const grid = useRef<any>()
  const gridOptions = useGridOptions({ model: variant.model })
  const [loading, setLoading] = useState(true)

  const {
    dataByGroup,
    groups,
  }: { dataByGroup: Record<string, any>; groups: Array<any> } = useStore(
    (state) => {
      const substances = getResults(state.reports.substances.data).results
      const includedSubstances = getIncludedSubstances(variant.model)
      const dataByGroup: Record<string, any> = {},
        groups: Array<any> = []
      const dataBySubstance = groupBy(
        getResults(report.section_a).results,
        'substance_id',
      )
      each(substances, (substance) => {
        const group = substance.group_name
        if (!includes(substance.sections, 'A')) return
        if (!includes(includedSubstances, substance.id)) return
        if (!includes(groups, group)) {
          groups.push(group)
        }
        if (!dataByGroup[group]) {
          dataByGroup[group] = []
        }
        const row = {
          annex_group: group,
          chemical_name: substance.name,
          display_name: substance.name,
          excluded_usages: substance.excluded_usages || [],
          group,
          record_usages: [],
          substance_id: substance.id,
          ...(dataBySubstance[substance.id]?.[0] || {}),
        }
        // if (!includes(includedSubstances, substance.id)) {
        //   if (!others[group]) {
        //     others[group] = []
        //   }
        //   others[group].push(row)
        // } else {
        //   dataByGroup[group].push(row)
        // }
        dataByGroup[group].push(row)
      })
      // forOwn(others, group => {
      //   console.log('HERE', reduce(others[group], (total, substance) => ({
      //   })))
      //   // const row = {
      //   //   annex_group: group,
      //   //   chemical_name: 'Other',
      //   //   display_name: 'Other',
      //   //   excluded_usages: [],
      //   //   group,
      //   //   record_usages: [],
      //   // }
      //   // dataByGroup[group].push({})
      // })

      return { dataByGroup, groups }
    },
  )

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    each(groups, (group) => {
      rowData = union(
        rowData,
        [{ chemical_name: group, group, isGroup: true }],
        dataByGroup[group],
        [{ chemical_name: 'Sub-total', group, isSubTotal: true }],
      )
    })
    if (rowData.length > 0) {
      rowData.push({ chemical_name: 'TOTAL', isTotal: true })
    }
    return rowData
  }, [dataByGroup, groups])

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        <Typography className="text-white" component="h1" variant="h6">
          SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON
          CONTROLLED SUBSTANCES (METRIC TONNES)
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <Table
          className="three-groups"
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          rowBuffer={20}
          rowData={rowData}
          suppressCellFocus={false}
          suppressRowHoverHighlight={false}
          rowClassRules={{
            'ag-row-group': (props) => props.data.isGroup,
            'ag-row-sub-total': (props) => props.data.isSubTotal,
            'ag-row-total': (props) => props.data.isTotal,
          }}
          onFirstDataRendered={(event) => {
            event.columnApi.autoSizeAllColumns()
          }}
          withSeparators
        />
      )}
    </>
  )
}
