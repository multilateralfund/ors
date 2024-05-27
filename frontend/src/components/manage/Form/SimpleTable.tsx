import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

function countHeader(columnDefs: any, iRow = 0, rows: any = []): any {
  let tCol = 0
  const colDefs = []

  if (rows.length <= iRow) {
    rows.push([])
  }

  for (let i = 0; i < columnDefs.length; i++) {
    const colDef = columnDefs[i]
    rows[iRow].push({ label: colDef.headerName })
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

function Header(props: any) {
  const { rows } = props

  const result = []

  for (let i = 0; i < rows.length; i++) {
    const Row = []
    const cols = rows[i]
    for (let j = 0; j < cols.length; j++) {
      const colDef = cols[j]
      const Col = (
        <th
          key={j}
          className="break-words border border-solid border-gray-200 bg-gray-50"
          colSpan={colDef.colspan || 0}
          rowSpan={colDef.colspan ? 1 : rows.length - i}
        >
          {colDef.label}
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

function apiForEachNodeSetup(rowData: any) {
  function iterator(callback: any) {
    for (let i = 0; i < rowData.length; i++) {
      callback({ data: rowData[i] })
    }
  }
  return iterator
}

function SimpleTable(props: any) {
  const { columnDefs, context, defaultColDef, rowData } = props

  console.log('rowData', rowData)
  console.log('columnDefs', columnDefs)
  console.log('defaultColDef', defaultColDef)

  const counts = countHeader(columnDefs)

  console.log(counts)

  const rows = []

  for (let i = 0; i < rowData.length; i++) {
    const row = []
    const data = rowData[i]
    for (let j = 0; j < counts.colDefs.length; j++) {
      const colDef = counts.colDefs[j]
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
      const cellClass =
        getCellClass(colDef, cellProps) ||
        getCellClass(defaultColDef, cellProps)
      const cellRenderer = (
        <AgCellRenderer value={data[colDef.field]} {...cellProps} />
      )
      row.push(
        <td
          key={j}
          className={`border border-solid border-gray-200 ${cellClass}`}
        >
          {cellRenderer}
        </td>,
      )
    }
    rows.push(<tr key={i}>{row}</tr>)
  }

  console.log(rows)

  return (
    <>
      <table className="ag-table border-collapse border border-solid border-gray-200">
        <thead className="border-b-3 border-x-0 border-t-0 border-solid border-primary">
          {<Header rows={counts.rows} />}
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </>
  )
}

export default SimpleTable
