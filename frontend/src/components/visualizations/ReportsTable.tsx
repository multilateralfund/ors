'use client'
import React from 'react'

import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import useStore from '@ors/store'

import Field from '../manage/Form/Field'

export default function ReportsTable() {
  const [page, setPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const reports = useStore((state) => state.reports)

  React.useEffect(() => {
    reports.getReports()

    /* eslint-disable-next-line */
  }, [])

  return (
    <div className="reports overflow-x-auto">
      <div className="px-4 pt-4">
        <p className="mb-4">All submissions</p>
        <div className="grid grid-cols-3 gap-x-4">
          <Field widget="autocomplete" Input={{ label: 'Party' }} />
          <Field widget="autocomplete" Input={{ label: 'Status' }} />
          <Field widget="autocomplete" Input={{ label: 'Status' }} />
          <Field widget="autocomplete" Input={{ label: 'From' }} />
          <Field widget="autocomplete" Input={{ label: 'To' }} />
        </div>
      </div>
      <Table size="small">
        <TableHead className="bg-gray-100 dark:bg-gray-700">
          <TableRow>
            <TableCell align="left">Report name</TableCell>
            <TableCell align="left">Country</TableCell>
            <TableCell align="center">Period</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!!reports.data &&
            reports.data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row: any) => {
                return (
                  <TableRow hover tabIndex={-1} key={row.id}>
                    <TableCell align="left">{row.name}</TableCell>
                    <TableCell align="left">{row.country}</TableCell>
                    <TableCell align="center">{row.year}</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell align="center">
                      <Button variant="outlined" size="small">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        rowsPerPageOptions={[10, 20, 30, 40, 50]}
        count={reports.data?.length}
        page={page}
        onPageChange={(_, page) => {
          setPage(page)
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(parseInt(event.target.value, 10))
        }}
        className="pr-2"
      />
    </div>
  )
}
