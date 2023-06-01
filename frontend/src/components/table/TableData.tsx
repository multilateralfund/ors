import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
} from '@tanstack/react-table'
import { IoTrash, IoCreate, IoCaretForward, IoCaretDown } from 'react-icons/io5'
import { Button } from '../shared/Button'
import { SectionsType, SectionsEnum } from '@/types/Reports'
import { deleteReport, ReportDataType } from '@/slices/reportSlice'
import { mappingColumnsWithState } from '@/utils/mappings'

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
  data = [],
  showModal,
  onEditRow,
}: {
  withSection: SectionsType
  selectedTab: number | string
  data?: ReportDataType[]
  showModal?: () => void
  onEditRow?: (row: Partial<ReportDataType>) => void
}) => {
  const dispatch = useDispatch()

  const columnsBySections = mappingColumnsWithState(Number(selectedTab))
  const substancesColumns = useMemo<ColumnDef<Partial<ReportDataType>>[]>(
    () => [
      {
        header: 'Substance',
        accessorKey: 'substance',
        cell: cell => {
          return cell?.row.getCanExpand() ? (
            <button
              className="flex items-center"
              onClick={cell.row.getToggleExpandedHandler()}
            >
              <span className="mr-1">
                {cell?.row?.original?.substance?.label}{' '}
              </span>
              {cell.row.getIsExpanded() ? <IoCaretForward /> : <IoCaretDown />}
            </button>
          ) : (
            cell?.row?.original?.substance?.label
          )
        },
      },
      {
        header: 'TOTAL',
        accessorKey: 'total',
        cell: cell => {
          return cell?.row?.original?.usage
            ?.map(item => Number(item))
            .reduce((acc, c) => acc + c, 0)
        },
      },
    ],
    [],
  )
  const defaultColumns = useMemo<ColumnDef<Partial<ReportDataType>>[]>(
    () => [
      {
        header: 'Actions',
        accessorKey: 'action',
        cell: ({ row: { original } }) => {
          return (
            <div className="flex w-full justify-center">
              <button
                className="w-5 h-5 text-sm text-blue-700 hover:text-blue-800"
                onClick={() => {
                  if (onEditRow) onEditRow(original)
                }}
              >
                <IoCreate />
              </button>
              <button
                className="w-5 h-5 text-sm text-red-600 hover:text-red-900"
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
    () => [
      ...substancesColumns,
      ...(columnsBySections as unknown as []),
      ...defaultColumns,
    ],
    [substancesColumns, columnsBySections, defaultColumns],
  )

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div className="mx-auto">
          <TableHeaderActions
            withSection={withSection}
            onAddSubstances={() => showModal && showModal()}
          />
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
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={row.getVisibleCells().length}>Usages:</td>
                      </tr>
                    )}
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
  withSection,
  onAddSubstances,
  onAddBlends,
}: {
  withSection: SectionsType
  onAddSubstances?: () => void
  onAddBlends?: () => void
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-end space-y-3 md:space-y-0 md:space-x-4 p-4">
      <div className="w-full md:w-3/6 flex items-center md:space-x-3 ">
        {withSection?.key == SectionsEnum.SectionB && (
          <Button onClick={onAddBlends}>+ Add blends</Button>
        )}
        <Button onClick={onAddSubstances}>+ Add substances</Button>
      </div>
    </div>
  )
}
