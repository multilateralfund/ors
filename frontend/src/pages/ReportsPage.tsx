import { FC, Fragment, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button as FlowButton } from 'flowbite-react'
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table'
import { Button } from '@/components/shared/Button'

export const ReportsPage: FC = function () {
  const navigate = useNavigate()

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
        {/* <Card className="max-w-fit">
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <p>Noteworthy technology acquisitions 2021</p>
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            <p>
              Here are the biggest enterprise technology acquisitions of 2021 so
              far, in reverse chronological order.
            </p>
          </p>
          <Button>
            <p>Read more</p>
          </Button>
        </Card> */}
      </div>
      <Table />
    </div>
  )
}

export const Table = () => {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Period',
        accessorKey: 'period',
      },
      {
        header: 'Status',
        accessorKey: 'status',
      },
      {
        header: 'Last updated',
        accessorKey: 'last_updated',
      },
      {
        header: 'Created by',
        accessorKey: 'created_by',
      },
      {
        header: 'Actions',
        accessorKey: 'action',
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

  const data: any[] = [
    {
      period: 2023,
      status: 'In progress',
      last_updated: '02 June 2023',
      created_by: 'Secretariat',
    },
    {
      period: 2023,
      status: 'Submitted',
      last_updated: '01 June 2023',
      created_by: 'Party',
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div className="mx-auto">
          <TableHeaderActions />
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

const TableHeaderActions = ({
  onAddSubstances,
  onAddBlends,
}: {
  onAddSubstances?: () => void
  onAddBlends?: () => void
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-end space-y-3 md:space-y-0 md:space-x-4 p-4">
      <div className="w-full flex items-center">
        <h4 className="text-lg dark:text-white">All submissions</h4>
      </div>
    </div>
  )
}

const TablePagination = ({ table }: { table: any }) => {
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
            table.setPageSize(Number(e.target.value))
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
