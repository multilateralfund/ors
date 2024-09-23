import type {
  CellApi,
  CellProps,
  Col,
  EditContext,
  HeaderProps,
  RowClassRule,
  SimpleColDef,
  SimpleRow,
  SimpleTableProps,
  TableCellProps,
} from './types'
import type { CPContext } from '@ors/components/manage/Blocks/CountryProgramme/types'

import React, { useMemo, useRef, useState } from 'react'

import cx from 'classnames'

import { defaultColDef as globalColDef } from '@ors/config/Table/columnsDef'
import components from '@ors/config/Table/components'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import AgHeaderComponent from '@ors/components/manage/AgComponents/AgHeaderComponent'

const ROW_CLASS_RULES: RowClassRule[] = [
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

function countHeader(
  columnDefs: SimpleColDef[],
  iRow = 0,
  rows: any[] = [],
): any {
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

function getHeaderComponentParams(colDef: SimpleColDef, cellProps: CellProps) {
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

const Header = React.memo(function Header(props: HeaderProps) {
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
        ...getHeaderComponentParams(colDef.colDef, { context } as CellProps),
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

function getCellClass(colDef: SimpleColDef, cellProps: CellProps) {
  let result = null

  if (colDef.cellClass && typeof colDef.cellClass === 'string') {
    result = colDef.cellClass
  } else if (typeof colDef.cellClass === 'function') {
    result = colDef.cellClass(cellProps)
  }

  return result
}

function getCellRendererParams(colDef: SimpleColDef, cellProps: CellProps) {
  let result = null

  if (colDef.cellRendererParams) {
    result = colDef.cellRendererParams(cellProps)
  }

  return result
}

function getRowClass(data: SimpleRow): string {
  const result = []
  for (let i = 0; i < ROW_CLASS_RULES.length; i++) {
    if (ROW_CLASS_RULES[i]?.[1]({ data })) {
      result.push(ROW_CLASS_RULES[i]?.[0])
    }
  }
  return result.join(' ')
}

function apiForEachNodeSetup(rowData: any[]) {
  function iterator(callback: (p: { data: any }) => void) {
    for (let i = 0; i < rowData.length; i++) {
      callback({ data: rowData[i] })
    }
  }
  return iterator
}

function apiGetRowNodeSetup(rowData: any[]) {
  function iterator(row_id: number) {
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

function getCellEditable(colDef: SimpleColDef, cellProps: CellProps) {
  let result = null

  if (colDef.editable && typeof colDef.editable === 'function') {
    result = colDef.editable(cellProps)
  } else if (colDef.editable !== undefined) {
    result = colDef.editable
  }

  return result
}

const TableCell = React.memo(function TableCell(props: TableCellProps) {
  const { cellProps, colDef, edit, iCol, iRow, onStartEdit, onStopEdit } = props

  const cellRef = useRef<any>(null)

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

  const rendered =
    !!colDef?.cellRenderer && !isEditCell ? (
      colDef.cellRenderer({ ...cellProps, ...cellRendererParams })
    ) : (
      <CellRenderer
        ref={cellRef}
        {...cellProps}
        {...cellRendererParams}
        stopEditing={handleStopEditing}
      />
    )

  return (
    <td
      className={cx(
        'border border-x border-solid border-gray-200 outline-2 outline-secondary first:border-l-0 last:border-r-0 focus:outline',
        { 'p-0 outline': isEditCell },
        cellClass,
      )}
      tabIndex={0}
      onDoubleClick={handleStartEditing}
      onKeyDown={handleStartEditing}
    >
      <div
        className={`flex ${cellClass?.indexOf('text-center') !== -1 ? 'justify-center' : ''}`}
      >
        {rendered}
      </div>
    </td>
  )
})

function makeRows(
  rowData: any[],
  counts: any,
  combinedColDef: SimpleColDef,
  context: CPContext,
  editableTable: boolean,
  editCell: [number, number] | null,
  onStartEdit: (iRow: number, iCol: number) => void,
  onStopEdit: SimpleTableProps['onEdit'],
) {
  const rows = []

  const t0 = performance.now()
  for (let i = 0; i < rowData.length; i++) {
    const row = []
    const data = rowData[i]
    for (let j = 0; j < counts.colDefs.length; j++) {
      const colDef: SimpleColDef = { ...combinedColDef, ...counts.colDefs[j] }
      const column: Col = {
        colId: colDef.field ?? colDef.id,
        getColId: () => colDef.field ?? colDef.id,
      }
      const cellProps: CellProps = {
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
        getValue: function () {
          return this.value
        },
        get value() {
          return this.data[this.colDef.field]
        },
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

function SimpleTable(props: any) {
  const {
    Toolbar,
    columnDefs,
    context,
    defaultColDef,
    editable,
    onEdit,
    rowData,
  } = props as SimpleTableProps

  const [fullScreen, setFullScreen] = useState(false)
  const [editingCell, setEditingCell] = useState<[number, number] | null>(null)

  const combinedColDef = useMemo(
    () => ({ ...globalColDef, ...defaultColDef }),
    [defaultColDef],
  )

  const counts = useMemo(() => countHeader(columnDefs), [columnDefs])

  function handleStartEdit(row: number, col: number) {
    setEditingCell([row, col])
  }

  function handleStopEdit(value: null | number | string, ctx: EditContext) {
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
