import * as React from 'react'

import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import Link from '@ors/components/ui/Link/Link'
import { useStore } from '@ors/store'

import { FiEdit, FiEye } from 'react-icons/fi'
import { IoEllipse } from 'react-icons/io5'

interface Data {
  country: string
  country_id: number
  created_at: string
  id: number
  status: string
  version: number
  version_created_by: string
  version_created_by_role: string
  year: number
}

function createData(
  id: number,
  year: number,
  country: string,
  status: string,
  version: number,
  created_date: string,
  version_created_by: string,
  version_created_by_role: string,
  country_id: number,
): Data {
  const dateTime = new Date(created_date)
  const date = dateTime.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = dateTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    hour12: false,
    minute: 'numeric',
  })
  const created_at = `${date} ${time} by ${version_created_by}`

  return {
    id,
    country,
    country_id,
    created_at,
    status,
    version,
    version_created_by,
    version_created_by_role,
    year,
  }
}

type Order = 'asc' | 'desc'

interface HeadCell {
  align?: 'center' | 'inherit' | 'justify' | 'left' | 'right'
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
    align: 'center',
    label: 'Status',
  },
  {
    id: 'version',
    align: 'center',
    disablePadding: true,
    label: 'Version',
  },
  {
    id: 'created_at',
    align: 'right',
    label: 'Last Modified',
    sortable: true,
  },
  {
    id: 'version_created_by_role',
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
    <TableHead className="select-none uppercase">
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
                  <Box className="sr-only print:hidden" component="span">
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
        <TableCell className="print:hidden" align="center">
          Action
        </TableCell>
      </TableRow>
    </TableHead>
  )
}

const LoadingSkeleton = ({ rows }: { rows?: number }) => (
  <>
    {[...Array(rows ?? 50)].map((_, index) => (
      <TableRow key={index}>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id}>
            <Skeleton />
          </TableCell>
        ))}
        <TableCell>
          <Skeleton />
        </TableCell>
      </TableRow>
    ))}
  </>
)

export default function SimpleTable(props: any) {
  const { data, setPagination, setParams } = props

  const [order, setOrder] = React.useState<Order>('desc')
  const [orderBy, setOrderBy] = React.useState<keyof Data>('created_at')
  const [loading, setLoading] = React.useState(false)

  const { canEditCPReports } = React.useContext(PermissionsContext)

  const rows = data.map((item: any) => {
    return createData(
      item.id,
      item.year,
      item.country,
      item.status,
      item.version,
      item.created_at,
      item.version_created_by,
      item.version_created_by_role,
      item.country_id,
    )
  })

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data,
  ) => {
    const isAsc = orderBy === property && order === 'asc'
    setLoading(true)
    setPagination((pagination: any) => ({
      ...pagination,
      page: 1,
    }))
    setParams({
      offset: 0,
      ordering: isAsc ? `-${property}` : property,
    })
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  React.useEffect(() => {
    setLoading(false)
  }, [data])

  return (
    <Box
      className="SimpleTable px-0 py-2 lg:px-4 print:border-none print:px-0 print:shadow-none"
      sx={{
        width: '100%',
      }}
    >
      <TableContainer>
        <Table
          aria-labelledby="tableTitle"
          size="small"
          // sx={{ minWidth: 600 }}
        >
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            rowCount={rows.length}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {loading ? (
              <LoadingSkeleton rows={rows.length} />
            ) : (
              rows.map((row: Data, index: number) => {
                const labelId = `cell-${index}`
                const statusDot = row.status === 'final' ? '#4191CD' : '#EE8E34'
                const status = row.status === 'final' ? 'Final' : 'Draft'
                const country = countriesById.get(row.country_id as number)

                return (
                  <TableRow key={row.id} tabIndex={-1}>
                    <TableCell id={labelId} align="right" scope="row">
                      {row.year}
                    </TableCell>
                    <TableCell align="center">{row.country}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={status}>
                        <Typography className="flex justify-center">
                          <IoEllipse color={statusDot} size={12} />
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">{row.version}</TableCell>
                    <TableCell align="right">{row.created_at}</TableCell>
                    <TableCell className="capitalize" align="left">
                      {row.version_created_by_role === 'country_user'
                        ? 'country'
                        : row.version_created_by_role}
                    </TableCell>
                    <TableCell className="print:hidden" align="center">
                      <Typography className="flex items-center justify-center">
                        <Link
                          className="text-pretty border-0 p-2 hover:text-secondary"
                          href={`/country-programme/${country?.iso3}/${row.year}`}
                          underline="none"
                        >
                          <FiEye size={16} />
                        </Link>
                        {canEditCPReports && (
                          <>
                            <span>/</span>
                            <Link
                              className="text-pretty border-0 p-2 hover:text-secondary"
                              href={`/country-programme/${country?.iso3}/${row.year}/edit`}
                              underline="none"
                            >
                              <FiEdit size={16} />
                            </Link>
                          </>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
