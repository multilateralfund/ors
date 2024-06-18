import React, { useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { defaultColDef as globalColDef } from '@ors/config/Table/columnsDef'
import components from '@ors/config/Table/components'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import AgHeaderComponent from '@ors/components/manage/AgComponents/AgHeaderComponent'

const ROW_CLASS_RULES = [
  ['ag-row-control', (props) => props.data.rowType === 'control'],
  ['ag-row-error', (props) => !!props.data.error],
  ['ag-row-group', (props) => props.data.rowType === 'group'],
  ['ag-row-hashed', (props) => props.data.rowType === 'hashed'],
  [
    'ag-row-sub-total border-b-3 border-primary border-solid border-x-0 border-t-0',
    (props) => props.data.rowType === 'subtotal',
  ],
  [
    'ag-row-total border-t-3 border-primary border-solid border-x-0 border-b-0',
    (props) => props.data.rowType === 'total',
  ],
]

function countHeader(columnDefs, iRow = 0, rows = []) {
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

function getHeaderComponentParams(colDef, cellProps) {
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

const Header = React.memo(function Header(props) {
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
          className="break-words align-bottom"
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
})

function getCellClass(colDef, cellProps) {
  let result = null

  if (colDef.cellClass && typeof colDef.cellClass === 'string') {
    result = colDef.cellClass
  } else if (colDef.cellClass) {
    result = colDef.cellClass(cellProps)
  }

  return result
}

function getCellRendererParams(colDef, cellProps) {
  let result = null

  if (colDef.cellRendererParams) {
    result = colDef.cellRendererParams(cellProps)
  }

  return result
}

function getRowClass(data) {
  const result = []
  for (let i = 0; i < ROW_CLASS_RULES.length; i++) {
    if (ROW_CLASS_RULES[i][1]({ data })) {
      result.push(ROW_CLASS_RULES[i][0])
    }
  }
  return result.join(' ')
}

function apiForEachNodeSetup(rowData) {
  function iterator(callback) {
    for (let i = 0; i < rowData.length; i++) {
      callback({ data: rowData[i] })
    }
  }
  return iterator
}

function apiGetRowNodeSetup(rowData) {
  function iterator(row_id) {
    let result = null
    for (let i = 0; i < rowData.length; i++) {
      if (rowData[i].row_id === row_id) {
        result = rowData[i]
        break
      }
    }
    return result
  }
  return iterator
}

function getCellEditable(colDef, cellProps) {
  let result = null

  if (colDef.editable && typeof colDef.editable === 'function') {
    result = colDef.editable(cellProps)
  } else if (colDef.editable !== undefined) {
    result = colDef.editable
  }

  return result
}

const TableCell = React.memo(function TableCell(props) {
  const { cellProps, colDef, edit, iCol, iRow, onStartEdit, onStopEdit } = props

  const cellRef = useRef(null)

  const isEditableCell = getCellEditable(colDef, cellProps)
  const isEditCell = isEditableCell && edit

  function handleStopEditing() {
    const savedValue = cellRef.current?.getValue()
    onStopEdit(savedValue, { colDef, iCol, iRow })
  }

  function handleStartEditing() {
    if (isEditableCell && !isEditCell) {
      onStartEdit(iRow, iCol)
    }
  }

  const cellClass = getCellClass(colDef, cellProps)
  const cellRendererParams = getCellRendererParams(colDef, cellProps)
  const CellRenderer = isEditCell
    ? components[colDef['cellEditor']]
    : AgCellRenderer

  return (
    <td
      className={cx(
        'border border-x border-solid border-gray-200 outline-2 outline-secondary first:border-l-0 last:border-r-0 focus:outline',
        { 'outline p-0': isEditCell },
        cellClass,
      )}
      tabIndex="0"
      onDoubleClick={handleStartEditing}
      onKeyDown={handleStartEditing}
    >
      <div
        className={`flex ${cellClass.indexOf('text-center') !== -1 ? 'justify-center' : ''}`}
      >
        <CellRenderer
          ref={cellRef}
          value={cellProps.data[colDef.field]}
          {...cellProps}
          {...cellRendererParams}
          stopEditing={handleStopEditing}
        />
      </div>
    </td>
  )
})

function makeRows(
  rowData,
  counts,
  combinedColDef,
  context,
  editableTable,
  editCell,
  onStartEdit,
  onStopEdit,
) {
  const rows = []

  const t0 = performance.now()
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
        api: {
          applyTransaction: () => null,
          flashCells: () => null,
          forEachNode: apiForEachNodeSetup(rowData),
          getRowNode: apiGetRowNodeSetup(rowData),
        },
        colDef,
        column,
        context,
        data,
      }
      const edit =
        editableTable && editCell && editCell[0] == i && editCell[1] == j
      row.push(
        <TableCell
          key={j}
          cellProps={cellProps}
          colDef={colDef}
          edit={edit}
          iCol={j}
          iRow={i}
          onStartEdit={onStartEdit}
          onStopEdit={onStopEdit}
        />,
      )
    }
    rows.push(
      <tr key={i} className={cx(getRowClass(data))}>
        {row}
      </tr>,
    )
  }
  return rows
}

function SimpleTable(props) {
  const {
    Toolbar,
    columnDefs,
    context,
    defaultColDef,
    editable,
    onEdit,
    rowData,
  } = props

  const [fullScreen, setFullScreen] = useState(false)
  const [editingCell, setEditingCell] = useState(null)

  const combinedColDef = useMemo(() => ({ ...globalColDef, ...defaultColDef }), [defaultColDef])

  const counts = useMemo(() => countHeader(columnDefs), [columnDefs])

  function handleStartEdit(row, col) {
    setEditingCell([row, col])
  }

  function handleStopEdit(value, ctx) {
    setEditingCell(null)
    onEdit(value, ctx)
  }

  const rows = makeRows(
    rowData,
    counts,
    combinedColDef,
    context,
    editable,
    editingCell,
    handleStartEdit,
    handleStopEdit,
  )

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
            'w-full border border-b-0 border-solid border-gray-200',
            props.className,
          )}
        >
          <table className="ag-table simple-table w-full border-collapse">
            <thead className="sticky top-0">
              <Header context={context} rows={counts.rows} />
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default SimpleTable
