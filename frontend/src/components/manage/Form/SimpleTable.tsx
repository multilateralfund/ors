function countHeader(columnDefs: any, iRow = 0, rows: any = []) {
  let tCol = 0

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
    } else {
      tCol += 1
    }
  }

  return { depth: iRow, rows, tCol }
}

function SimpleTable(props: any) {
  const { columnDefs, defaultColDef, rowData } = props

  console.log('rowData', rowData)
  console.log('columnDefs', columnDefs)
  console.log('defaultColDef', defaultColDef)

  const counts = countHeader(columnDefs)

  console.log('counts', counts)
  console.log('rows', counts.rows)

  const Header = []

  for (let i = 0; i < counts.rows.length; i++) {
    const Row = []
    const cols = counts.rows[i]
    for (let j = 0; j < cols.length; j++) {
      const colDef = cols[j]
      const Col = (
        <th
          className="break-words border border-solid border-primary"
          colSpan={colDef.colspan || 0}
          rowSpan={colDef.colspan ? 1 : counts.rows.length - i}
        >
          {colDef.label}
        </th>
      )
      Row.push(Col)
    }
    Header.push(<tr>{Row}</tr>)
  }

  return (
    <>
      <table className="border-collapse border border border-solid border-primary">
        <thead>{Header}</thead>
        <tbody></tbody>
      </table>
    </>
  )
}

export default SimpleTable
