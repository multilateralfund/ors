import { useMemo, useRef } from 'react'

import { each, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionAView(props: any) {
  const { TableProps, emptyForm, index, report, setActiveSection, variant } =
    props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    model: variant.model,
    usages: emptyForm.usage_columns || [],
  })

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    const dataByGroup: Record<string, any> = {}
    const groups: Array<string> = []
    each(report.section_a, (item) => {
      const group = item.group || 'Other'
      if (!dataByGroup[group]) {
        dataByGroup[group] = []
      }
      if (!includes(groups, group)) {
        groups.push(group)
      }
      dataByGroup[group].push({ ...item, group })
    })
    each(groups, (group: string) => {
      rowData = union(
        rowData,
        [{ display_name: group, group, rowType: 'group' }],
        dataByGroup[group],
        [{ display_name: 'Sub-total', group, rowType: 'subtotal' }],
      )
    })
    return rowData
  }, [report])

  const pinnedBottomRowData = useMemo(() => {
    return rowData.length > 0
      ? [{ display_name: 'TOTAL', rowType: 'total' }]
      : []
  }, [rowData])

  return (
    <>
      <Table
        {...TableProps}
        className="three-groups"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={3}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!rowData.length) {
            setActiveSection(index)
          }
        }}
      />
    </>
  )
}
