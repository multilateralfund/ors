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

function getGroupName(substance: any) {
  if (substance.blend_id) {
    return 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group_name
}

export default function SectionAView(props: {
  report: Record<string, Array<any>>
  variant: any
}) {
  const { report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
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
      const data = getResults(report.section_b).results
      const dataBySubstance = groupBy(data, 'substance_id')
      const dataByBlend = groupBy(data, 'blend_id')

      function addSubstance(substance: any, blends = false) {
        const group = getGroupName(substance)
        const byBlend = blends && substance.blend_id
        const bySubstance = !blends && includes(substance.sections, 'B')
        if (!byBlend && !bySubstance) return
        if (bySubstance && !includes(includedSubstances, substance.id)) return
        if (!includes(groups, group)) {
          groups.push(group)
        }
        if (!dataByGroup[group]) {
          dataByGroup[group] = []
        }
        const row = {
          annex_group: group,
          group,
          ...(bySubstance
            ? {
                chemical_name: substance.formula,
                display_name: substance.name,
                excluded_usages: substance.excluded_usages || [],
                record_usages: [],
                substance_id: substance.id,
                ...(dataBySubstance[substance.id]?.[0] || {}),
              }
            : {
                ...(dataByBlend[substance.blend_id]?.[0] || {}),
              }),
        }
        dataByGroup[group].push(row)
      }

      each(substances, (substance) => {
        addSubstance(substance)
      })
      each(data, (substance) => {
        addSubstance(substance, true)
      })
      return { dataByGroup, groups }
    },
  )

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    each(groups, (group) => {
      rowData = union(
        rowData,
        [{ display_name: group, group, isGroup: true }],
        dataByGroup[group],
        [{ display_name: 'Sub-total', group, isSubTotal: true }],
      )
    })
    if (rowData.length > 0) {
      rowData.push({ display_name: 'TOTAL', isTotal: true })
    }
    return rowData
  }, [dataByGroup, groups])

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h5">
            {report.name}
          </Typography>
        )}
        <Typography className="text-white" component="h2" variant="h6">
          SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <>
          <Table
            className="three-groups h-[800px]"
            columnDefs={gridOptions.columnDefs}
            defaultColDef={gridOptions.defaultColDef}
            domLayout="normal"
            enableCellChangeFlash={true}
            enablePagination={false}
            gridRef={grid}
            noRowsOverlayComponentParams={{ label: 'No data reported' }}
            rowBuffer={40}
            rowData={rowData}
            suppressCellFocus={false}
            suppressRowHoverHighlight={false}
            rowClassRules={{
              'ag-row-group': (props) => props.data.isGroup,
              'ag-row-sub-total': (props) => props.data.isSubTotal,
              'ag-row-total': (props) => props.data.isTotal,
            }}
            withSeparators
          />
        </>
      )}
    </>
  )
}
