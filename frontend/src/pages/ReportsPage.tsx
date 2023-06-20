import { FC, Fragment, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button as FlowButton } from 'flowbite-react'
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  Column,
  Table as ReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/shared/Button'
import { useGetCountriesQuery, useGetCountyReportsQuery } from '@/services/api'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectCountries,
  selectCountryReports,
  selectCountryReportsFilters,
  setCountryReportsFilters,
} from '@/slices/reportSlice'
import { CountryReports, CountryReportsFilters } from '@/types/Reports'

export const ReportsPage: FC = function () {
  const navigate = useNavigate()
  useGetCountriesQuery(null)

  const filters = useSelector(selectCountryReportsFilters)

  useGetCountyReportsQuery(filters)

  const data = useSelector(selectCountryReports)

  return (
    <div className="mt-4 flex flex-col">
      <div className="cards flex justify-between">
        <Card className="max-w-fit mr-5">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <p>Create submission {new Date().getFullYear()}</p>
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            Create a submission
          </p>
          <Button onClick={() => navigate('/reports/create')}>Create</Button>
        </Card>
      </div>
      <Table data={data || []} />
    </div>
  )
}

export const Table = ({ data }: { data: CountryReports[] }) => {
  const columns = useMemo<ColumnDef<CountryReports>[]>(
    () => [
      {
        header: 'Report name',
        accessorKey: 'name',
      },
      {
        header: 'Country',
        accessorKey: 'country',
      },
      {
        header: 'Period',
        accessorKey: 'year',
        meta: {
          filter: 'year',
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        meta: {
          filter: 'status',
        },
      },
      {
        header: 'Actions',
        accessorKey: 'action',
        enableColumnFilter: false,
        cell: ({ row: { original } }) => {
          return (
            <div className="flex w-full justify-center">
              {original.status === 'Submitted' ? (
                <FlowButton size={'xs'} color="gray">
                  View
                </FlowButton>
              ) : (
                <FlowButton size={'xs'} color="gray">
                  Edit
                </FlowButton>
              )}
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div className="mx-auto">
          <div className="flex flex-col p-4">
            <div className="w-full mb-2">
              <h4 className="text-sm dark:text-white">All submissions</h4>
            </div>
            <Filters />
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-400  dark:border-gray-600">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          scope="col"
                          className="px-2 py-1 border text-center dark:border-gray-600"
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              <div className="text-[0.65rem]">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </div>
                            </>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <Fragment key={row.id}>
                    <tr className="border-b dark:border-gray-600">
                      {row.getVisibleCells().map(cell => {
                        return (
                          <td key={cell.id} className="px-2 py-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
            <TablePagination table={table} />
          </div>
        </div>
      </div>
    </section>
  )
}

const TablePagination = ({ table }: { table: ReactTable<any> }) => {
  return (
    <nav
      className="flex items-center justify-between pt-4 px-2 pb-4"
      aria-label="Table navigation"
    >
      <div className="flex items-center text-sm font-normal text-gray-500 dark:text-gray-400 w-">
        <span>Rows per page</span>
        <select
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-16 p-1 mx-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          value={table.getState().pagination.pageSize}
          onChange={e => {
            // table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">
            1-10
          </span>{' '}
          of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            1000
          </span>
        </span>
      </div>
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="block px-2 py-1 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span className="sr-only">Previous</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </li>
        <li>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="block px-2 py-1 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span className="sr-only">Next</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  )
}

const Filters = () => {
  const dispatch = useDispatch()
  const countries = useSelector(selectCountries) || []
  const now = new Date().getUTCFullYear() + 1
  const years = Array(now - (now - 38))
    .fill('')
    .map((_, idx) => now - idx) as Array<number>

  return (
    <>
      <div className="filters grid grid-cols-3 gap-2">
        <div className="flex">
          <label className="flex-shrink-0 z-10 inline-flex items-center py-1 px-2 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            Party
          </label>
          <select
            id="states"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg border-l-gray-100 dark:border-l-gray-700 border-l-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={ev => {
              dispatch(
                setCountryReportsFilters({
                  country_id: Number(ev.target.value),
                }),
              )
            }}
          >
            <option>Choose a state</option>
            {countries.map(country => (
              <option value={country.id} key={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex">
          <label className="flex-shrink-0 z-10 inline-flex items-center py-1 px-2 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            Status
          </label>
          <select
            id="states"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg border-l-gray-100 dark:border-l-gray-700 border-l-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option>Any</option>
            <option value="TX">Data entry in progress</option>
            <option value="FL">Submitted</option>
            <option value="FL">Recalled</option>
            <option value="FL">Processing</option>
            <option value="WH">Finalized</option>
          </select>
        </div>
        <div className="flex">
          <label className="flex-shrink-0 z-10 inline-flex items-center py-1 px-2 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            Status
          </label>
          <select
            id="states"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg border-l-gray-100 dark:border-l-gray-700 border-l-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option selected>Any</option>
            <option value="TX">Data entry in progress</option>
            <option value="FL">Submitted</option>
            <option value="FL">Recalled</option>
            <option value="FL">Processing</option>
            <option value="WH">Finalized</option>
          </select>
        </div>

        <div className="flex">
          <label className="flex-shrink-0 z-10 inline-flex items-center py-1 px-2 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            From
          </label>
          <select
            id="states"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg border-l-gray-100 dark:border-l-gray-700 border-l-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={ev => {
              dispatch(
                setCountryReportsFilters({
                  year: Number(ev.target.value),
                }),
              )
            }}
          >
            <option>Any</option>
            {years.map(year => (
              <option key={`from-${year}`} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex">
          <label className="flex-shrink-0 z-10 inline-flex items-center py-1 px-2 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600">
            To
          </label>
          <select
            id="states"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-lg border-l-gray-100 dark:border-l-gray-700 border-l-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option>Any</option>
            {years.map(year => (
              <option key={`to-${year}`} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
