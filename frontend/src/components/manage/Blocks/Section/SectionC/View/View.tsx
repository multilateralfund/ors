import { useMemo, useRef } from 'react'

import { each, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionCView(props: any) {
  const { TableProps, index, report, setActiveSection } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    const dataByGroup: Record<string, any> = {}
    const groups: Array<string> = []
    each(report.section_c, (item) => {
      const group = item.group || 'Alternatives'
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

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
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
