import { useEffect, useRef, useState } from 'react'

import cx from 'classnames'
import { range } from 'lodash'

import { defaultColDef as globalColDef } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import AgHeaderComponent from '@ors/components/manage/AgComponents/AgHeaderComponent'

const ROW_CLASS_RULES: any = [
  ['ag-row-control', (props: any) => props.data.rowType === 'control'],
  ['ag-row-error', (props: any) => !!props.data.error],
  ['ag-row-group', (props: any) => props.data.rowType === 'group'],
  ['ag-row-hashed', (props: any) => props.data.rowType === 'hashed'],
  [
    'ag-row-sub-total border-b-3 border-primary border-solid border-x-0 border-t-0',
    (props: any) => props.data.rowType === 'subtotal',
  ],
  [
    'ag-row-total border-t-3 border-primary border-solid border-x-0 border-b-0',
    (props: any) => props.data.rowType === 'total',
  ],
]

function usePinTableHeader(tableRef: any) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const theadRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const tHeader = theadRef.current as HTMLElement
        if (entry.intersectionRatio && entry.intersectionRect.top < 10) {
          tHeader.style.position = 'sticky'
          tHeader.style.top = '0'
          tHeader.style.zIndex = '10'
        } else {
          tHeader.style.removeProperty('position')
          tHeader.style.removeProperty('top')
          tHeader.style.removeProperty('z-index')
        }
      },
      {
        threshold: range(1, 101).map((v) => v / 100), // [..., 0.09, 0.1] instead of [..., 0.09, 0.09999999...]
      },
    )
    const currentObserver = observerRef.current
    return () => currentObserver.disconnect()
  }, [])

  useEffect(() => {
    const currentObserver = observerRef.current as IntersectionObserver
    const currentTable = tableRef.current

    theadRef.current = currentTable.querySelector('thead')

    currentObserver.observe(currentTable)

    return () => {
      currentObserver.unobserve(currentTable)
    }
  }, [tableRef])
}

function countHeader(columnDefs: any, iRow = 0, rows: any = []): any {
  let tCol = 0
  const colDefs = []

  if (rows.length <= iRow) {
    rows.push([])
  }

  for (let i = 0; i < columnDefs.length; i++) {
    const colDef = columnDefs[i]
    rows[iRow].push({ colDef, label: colDef.headerName })
    if (colDef.children && colDef.children.length) {
      const counts = countHeader(colDef.children, iRow + 1, rows)
      tCol += counts.tCol
      rows[iRow][i].colspan = counts.tCol
      colDefs.push(...counts.colDefs)
    } else {
      tCol += 1
      colDefs.push(colDef)
    }
  }

  return { colDefs, depth: iRow, rows, tCol }
}

function getHeaderComponentParams(colDef: any, cellProps: any): any {
  let result = null

  if (
    colDef.headerComponentParams &&
    typeof colDef.headerComponentParams === 'function'
  ) {
    result = colDef.headerComponentParams(cellProps)
  } else if (colDef.headerComponentParams) {
    result = colDef.headerComponentParams
  }

  return result
}

function Header(props: any) {
  const { context, rows } = props

  const result = []

  for (let i = 0; i < rows.length; i++) {
    const Row = []
    const cols = rows[i]
    for (let j = 0; j < cols.length; j++) {
      const colDef = cols[j]
      const headerParams = {
        colDef: colDef.colDef,
        displayName: colDef.label,
        ...getHeaderComponentParams(colDef.colDef, { context }),
      }
      const Col = (
        <th
          key={j}
          className="break-words border border-t-0 border-solid border-gray-200 bg-gray-50 p-2 align-bottom first:rounded-tl-lg first:border-l-0 last:rounded-tr-lg last:border-r-0"
          colSpan={colDef.colspan || 0}
          rowSpan={colDef.colspan ? 1 : rows.length - i}
        >
          <AgHeaderComponent className="font-bold" {...headerParams} />
        </th>
      )
      Row.push(Col)
    }
    result.push(<tr key={i}>{Row}</tr>)
  }

  return result
}

function getCellClass(colDef: any, cellProps: any) {
  let result = null

  if (colDef.cellClass && typeof colDef.cellClass === 'string') {
    result = colDef.cellClass
  } else if (colDef.cellClass) {
    result = colDef.cellClass(cellProps)
  }

  return result
}

function getCellRendererParams(colDef: any, cellProps: any): any {
  let result = null

  if (colDef.cellRendererParams) {
    result = colDef.cellRendererParams(cellProps)
  }

  return result
}

function getRowClass(data: any) {
  const result = []
  for (let i = 0; i < ROW_CLASS_RULES.length; i++) {
    if (ROW_CLASS_RULES[i][1]({ data })) {
      result.push(ROW_CLASS_RULES[i][0])
    }
  }
  return result.join(' ')
}

function apiForEachNodeSetup(rowData: any) {
  function iterator(callback: any) {
    for (let i = 0; i < rowData.length; i++) {
      callback({ data: rowData[i] })
    }
  }
  return iterator
}

function SimpleTable(props: any) {
  const { Toolbar, columnDefs, context, defaultColDef, rowData } = props

  const [fullScreen, setFullScreen] = useState(false)
  const tableRef = useRef(null)

  usePinTableHeader(tableRef)

  const combinedColDef = { ...globalColDef, ...defaultColDef }

  const counts = countHeader(columnDefs)

  const rows = []

  for (let i = 0; i < rowData.length; i++) {
    const row = []
    const data = rowData[i]
    for (let j = 0; j < counts.colDefs.length; j++) {
      const colDef = { ...combinedColDef, ...counts.colDefs[j] }
      const column = {
        colId: colDef.field ?? colDef.id,
        getColId: () => colDef.field ?? colDef.id,
      }
      const cellProps = {
        api: { forEachNode: apiForEachNodeSetup(rowData) },
        colDef,
        column,
        context,
        data,
      }
      const cellClass = getCellClass(colDef, cellProps)
      const cellRendererParams = getCellRendererParams(colDef, cellProps)
      const cellRenderer = (
        <AgCellRenderer
          value={data[colDef.field]}
          {...cellProps}
          {...cellRendererParams}
        />
      )
      row.push(
        <td
          key={j}
          className={`border border-x border-solid border-gray-200 px-2 py-2 first:border-l-0 last:border-r-0 ${cellClass}`}
        >
          <div
            className={`flex ${cellClass.indexOf('text-center') !== -1 ? 'justify-center' : ''}`}
          >
            {cellRenderer}
          </div>
        </td>,
      )
    }
    rows.push(
      <tr key={i} className={cx(getRowClass(data))}>
        {row}
      </tr>,
    )
  }

  return (
    <>
      <div
        className={cx('ag-table-root flex flex-col', {
          'ag-full-screen': fullScreen,
        })}
      >
        {Toolbar && (
          <div className="ag-toolbar">
            <Toolbar
              {...props}
              enterFullScreen={() => setFullScreen(true)}
              exitFullScreen={() => setFullScreen(false)}
              fullScreen={fullScreen}
              gridContext={context}
              onUnitSelectionChange={props.handleUnitSelectionChange}
            />
          </div>
        )}
        <div
          className={cx(
            'w-full rounded-t-lg border border-b-0 border-solid border-gray-200',
            props.className,
          )}
        >
          <table className="ag-table w-full border-collapse" ref={tableRef}>
            <thead className="border-b-3 border-x-0 border-t-0 border-solid border-primary">
              {<Header context={context} rows={counts.rows} />}
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default SimpleTable
