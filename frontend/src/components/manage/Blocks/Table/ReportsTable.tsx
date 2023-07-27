'use client'
import React, { useMemo } from 'react'

import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import { times } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Loading from '@ors/components/theme/Loading/Loading'
import { getResults } from '@ors/helpers'
import { ReportsSlice } from '@ors/slices/createReportsSlice'
import useStore from '@ors/store'

type Filters = { country_id?: number | string }
type CountryOption = { id: number; label: string | undefined; name?: string }
type Report = {
  country: string
  id: number
  name: string
  type?: string
  year: number
}

export default function ReportsTable() {
  const [page, setPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [filters, setFilters] = React.useState<Filters>({})
  const reportsManager: ReportsSlice = useStore((state) => state.reports)
  const { loading = false } = reportsManager.get || {}

  const reports = useMemo(() => {
    const { count, results } = getResults(reportsManager.get.data)
    const resultsWithSkeleton =
      results.length === 0
        ? times(rowsPerPage, (index) => {
            return {
              id: `${page}-${index}`,
              type: 'skeleton',
            }
          })
        : results
    return { count, results: resultsWithSkeleton }
    /* eslint-disable-next-line */
  }, [reportsManager.get])

  const countries = useMemo(() => {
    return getResults(reportsManager.countries.get.data)
  }, [reportsManager.countries])

  const countriesOptions: CountryOption[] = useMemo(() => {
    return [
      { id: 0, label: 'Any' },
      ...countries.results.map((country: CountryOption) => ({
        id: country.id,
        label: country.name,
      })),
    ]
  }, [countries])

  const { count, results } = reports

  function handleFilterChange(
    key: keyof Filters,
    value: number | string,
    deleteFilter: boolean,
  ): void {
    setPage(1)
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      if (deleteFilter) {
        delete newFilters[key]
      } else {
        newFilters[key] = value
      }
      return newFilters
    })
  }

  React.useEffect(() => {
    reportsManager.getReports?.({
      limit: rowsPerPage,
      offset: (page - 1) * rowsPerPage,
      ...filters,
    })
    /* eslint-disable-next-line */
  }, [page, rowsPerPage, filters])

  React.useEffect(() => {
    const { loaded, loading } = reportsManager.countries.get
    if (!loading && !loaded) {
      reportsManager.countries.getCountries?.()
    }
  }, [reportsManager.countries])

  return (
    <div className="reports relative overflow-x-auto">
      {loading && results[0]?.type !== 'skeleton' && (
        <Loading
          className="z-10 bg-action-disabledBackground/5"
          ProgressStyle={{ animationDuration: '0.3s' }}
        />
      )}
      <div className="px-4 pt-4">
        <Typography className="mb-4">All submissions</Typography>
        <div className="grid grid-cols-3 gap-x-4">
          <Field
            Input={{ label: 'Party' }}
            defaultValue="Any"
            options={countriesOptions}
            widget="autocomplete"
            onChange={(_: any, value: CountryOption) => {
              handleFilterChange('country_id', value?.id, !value?.id)
            }}
          />
          {/* <Field Input={{ label: 'Status' }} widget="autocomplete" />
          <Field Input={{ label: 'Status' }} widget="autocomplete" />
          <Field Input={{ label: 'From' }} widget="autocomplete" />
          <Field Input={{ label: 'To' }} widget="autocomplete" /> */}
        </div>
      </div>
      <Table size="small">
        <TableHead className="bg-action-highlight">
          <TableRow>
            <TableCell align="left">Report name</TableCell>
            <TableCell align="left">Country</TableCell>
            <TableCell align="center">Period</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((row: Report) => {
            return (
              <TableRow
                key={row.id}
                initial={{ opacity: 0 }}
                exit={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                FadeInOut={{ component: 'tr' }}
                component={FadeInOut}
                tabIndex={-1}
                hover
              >
                <TableCell align="left">
                  {row.type === 'skeleton' ? <Skeleton /> : row.name}
                </TableCell>
                <TableCell align="left">
                  {row.type === 'skeleton' ? <Skeleton /> : row.country}
                </TableCell>
                <TableCell align="center">
                  {row.type === 'skeleton' ? <Skeleton /> : row.year}
                </TableCell>
                <TableCell align="center">
                  {row.type === 'skeleton' ? <Skeleton /> : null}
                </TableCell>
                <TableCell align="center">
                  <Button
                    className={
                      row.type === 'skeleton'
                        ? 'border-transparent hover:border-transparent hover:bg-transparent'
                        : undefined
                    }
                    disableRipple={row.type === 'skeleton'}
                    size="small"
                    variant="outlined"
                  >
                    {row.type === 'skeleton' ? (
                      <Skeleton className="mx-auto w-[80px]" />
                    ) : (
                      'Edit'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <TablePagination
        className="pr-2"
        component="div"
        count={count}
        page={page - 1}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 20, 30, 40, 50]}
        SelectProps={{
          disabled: loading,
        }}
        backIconButtonProps={
          loading
            ? {
                disabled: true,
              }
            : undefined
        }
        nextIconButtonProps={
          loading
            ? {
                disabled: true,
              }
            : undefined
        }
        onPageChange={(_, page) => {
          setPage(page + 1)
        }}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(parseInt(event.target.value, 10))
        }}
      />
    </div>
  )
}
