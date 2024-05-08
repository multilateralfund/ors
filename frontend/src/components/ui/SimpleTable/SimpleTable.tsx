import * as React from 'react'

import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'

import { useStore } from '@ors/store'

// const ROWS_PER_PAGE = 50

interface Data {
  country: string
  country_id: number
  created_by: string
  id: number
  last_modified: string
  status: string
  version: number
  year: number
}

function createData(
  id: number,
  year: number,
  country: string,
  status: string,
  version: number,
  created_at: string,
  created_by: string,
  country_id: number,
): Data {
  const dateTime = new Date(created_at)
  const date = dateTime.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
  const time = dateTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    hour12: false,
    minute: 'numeric',
  })
  const last_modified = `${date} ${time}`

  return {
    id,
    country,
    country_id,
    created_by,
    last_modified,
    status,
    version,
    year,
  }
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

type Order = 'asc' | 'desc'

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number,
) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

interface HeadCell {
  align?: "center" | "inherit" | "justify" | "left" | "right";
  disablePadding?: boolean
  id: keyof Data
  label: string
  sortable?: boolean
}

const headCells: readonly HeadCell[] = [
  {
    id: 'year',
    align: 'right',
    label: 'Year',
    sortable: true,
  },
  {
    id: 'country',
    align: 'center',
    label: 'Country',
  },
  {
    id: 'status',
    align: 'right',
    label: 'Status',
  },
  {
    id: 'version',
    align: 'right',
    label: 'Version',
  },
  {
    id: 'last_modified',
    align: 'right',
    label: 'Last Modified',
    sortable: true,
  },
  {
    id: 'created_by',
    align: 'left',
    label: 'Created by',
  },
]

interface EnhancedTableProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data,
  ) => void
  order: Order
  orderBy: string
  rowCount: number
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { onRequestSort, order, orderBy } = props
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property)
    }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'center'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box className="sr-only" component="span">
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              // If the column is not sortable, just render the label
              headCell.label
            )}
          </TableCell>
        ))}
        <TableCell align="right">Action</TableCell>
      </TableRow>
    </TableHead>
  )
}

export default function SimpleTable(props: any) {
  const { data } = props

  const [order, setOrder] = React.useState<Order>('desc')
  const [orderBy, setOrderBy] = React.useState<keyof Data>('year')

  const [dense, setDense] = React.useState(false)
  const rows = data.map((item: any) => {
    return createData(
      item.id,
      item.year,
      item.country,
      item.status,
      item.version,
      item.created_at,
      item.created_by,
      item.country_id,
    )
  })

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data,
  ) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleClick = (
    event: React.MouseEvent<unknown>,
    year: number,
    iso3: string,
  ) => {
    event.preventDefault()

    // router.push(`/country-programme/${iso3}/${year}`)
    window.location.href = `/country-programme/${iso3}/${year}`
  }

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked)
  }

  const visibleRows = React.useMemo(
    () => stableSort(rows, getComparator(order, orderBy)),
    [order, orderBy, rows],
  )
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2, width: '100%' }}>
        <TableContainer>
          <Table
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
            sx={{ minWidth: 750 }}
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              rowCount={rows.length}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const labelId = `cell-${index}`

                return (
                  <TableRow
                    key={row.id}
                    role="checkbox"
                    sx={{ cursor: 'pointer' }}
                    tabIndex={-1}
                    onClick={(event) =>
                      handleClick(
                        event,
                        row.year as number,
                        countriesById.get(row.country_id as number)?.iso3,
                      )
                    }
                    hover
                  >
                    <TableCell
                      id={labelId}
                      align="right"
                      component="th"
                      scope="row"
                    >
                      {row.year}
                    </TableCell>
                    <TableCell align="center">{row.country}</TableCell>
                    <TableCell align="right">{row.status}</TableCell>
                    <TableCell align="right">{row.version}</TableCell>
                    <TableCell align="right">{row.last_modified}</TableCell>
                    <TableCell align="left">{row.created_by}</TableCell>
                    <TableCell align="center">View / Create</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      />
    </Box>
  )
}
