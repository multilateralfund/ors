import { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  ColumnDef,
} from '@tanstack/react-table'
import { IoTrash, IoCreate } from 'react-icons/io5'
import { Button } from '../shared/Button'
import { SectionsType } from '@/types/Reports'
import {
  deleteReport,
  selectRecordsData,
  selectUsagesBySection,
  ReportDataType,
} from '@/slices/reportSlice'
import { RootState } from '@/store'
import { mappingTableColumns } from '@/utils/mappings'

const composeColumnsByUsages = (
  usages: any[],
  excludedUsages: string[],
): any[] => {
  const columns = []
  for (let i = 0; i < usages.length; i++) {
    if (!excludedUsages.includes(usages[i].full_name)) {
      continue
    }

    if (usages[i] && usages[i].children.length) {
      columns.push({
        header: usages[i].name,
        columns: composeColumnsByUsages(usages[i].children, excludedUsages),
      })
    } else {
      columns.push({
        header: usages[i].name,
        accessorKey: String(usages[i].id),
      })
    }
  }

  return columns
}

export const TableData = ({
  withSection,
  selectedTab,
  showModal,
  onEditRow,
}: {
  withSection: SectionsType
  selectedTab: number | string
  showModal?: () => void
  onEditRow?: (row: unknown) => void
}) => {
  const data = useSelector(selectRecordsData)
  const dispatch = useDispatch()

  const usagesColumns = mappingTableColumns[selectedTab]?.columns || []

  const defaultColumns = useMemo(
    () => [
      {
        header: 'Imports',
        accessorKey: 'imports',
      },
      {
        header: 'Exports',
        accessorKey: 'exports',
      },
      {
        header: 'Production',
        accessorKey: 'production',
      },
      {
        header: 'Import Quotas',
        accessorKey: 'import_quotas',
      },
      {
        header: 'Date ban',
        accessorKey: 'date_ban',
      },
      {
        header: 'Remarks',
        accessorKey: 'remarks',
      },
      {
        header: 'Actions',
        accessorKey: 'action',
        cell: ({ row: { original } }) => {
          return (
            <div className="flex w-100 justify-between">
              <button
                className="w-5 h-5"
                onClick={() => {
                  if (onEditRow) onEditRow(original)
                }}
              >
                <IoCreate />
              </button>
              <button
                className="w-5 h-5"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  //@ts-ignore
                  dispatch(deleteReport({ substance: original?.substance }))
                }}
              >
                <IoTrash />
              </button>
            </div>
          )
        },
      },
    ],
    [],
  )

  const columns = useMemo<ColumnDef<Partial<ReportDataType>>[]>(
    () => [...usagesColumns, ...defaultColumns],
    [usagesColumns, defaultColumns],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div className="mx-auto">
          <TableHeaderActions
            onAddSubstances={() => showModal && showModal()}
          />
          <div className="relative overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-400  dark:border-gray-600">
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
                  <>
                    <tr
                      key={row.id}
                      className="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

const TableHeaderActions = ({
  onAddSubstances,
}: {
  onAddSubstances?: () => void
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-end space-y-3 md:space-y-0 md:space-x-4 p-4">
      <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
        <Button onClick={onAddSubstances}>+ Add substances</Button>
      </div>
    </div>
  )
}
