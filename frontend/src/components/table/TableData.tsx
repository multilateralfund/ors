import { Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  Row,
} from '@tanstack/react-table'
import { IoTrash, IoCreate, IoCaretForward, IoCaretDown } from 'react-icons/io5'
import { Button } from '../shared/Button'
import { SectionsType, SectionsEnum, Usage } from '@/types/Reports'
import {
  deleteReport,
  ReportDataType,
  selectUsages,
} from '@/slices/reportSlice'
import { mappingColumnsWithState } from '@/utils/mappings'

type ShowModalType = {
  hasBlends: boolean
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
  data?: ReportDataType[] | undefined
  showModal?: ({ hasBlends }: ShowModalType) => void
  onEditRow?: (row: Partial<ReportDataType>) => void
}) => {
  const dispatch = useDispatch()

  const columnsBySections = mappingColumnsWithState(Number(selectedTab))
  const substancesColumns = useMemo<ColumnDef<ReportDataType>[]>(
    () => [
      {
        header: 'Chemical',
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
              {cell.row.getIsExpanded() ? <IoCaretDown /> : <IoCaretForward />}
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
  const defaultColumns = useMemo<ColumnDef<ReportDataType>[]>(
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
                  dispatch(
                    deleteReport({
                      substanceId: Number(original?.substance?.id),
                      sectionId: Number(selectedTab),
                    }),
                  )
                }}
              >
                <IoTrash />
              </button>
            </div>
          )
        },
      },
    ],
    [selectedTab],
  )
  const columns = useMemo<ColumnDef<ReportDataType>[]>(
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
            onAddSubstances={() => showModal && showModal({ hasBlends: false })}
            onAddBlends={() => showModal && showModal({ hasBlends: true })}
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
                    {row.getIsExpanded() && (
                      <tr>
                        <td colSpan={row.getVisibleCells().length}>
                          <TableExpandedRow substance={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

const TableExpandedRow = ({
  substance,
}: {
  substance: Row<ReportDataType>
}) => {
  const usages = useSelector(selectUsages)

  const columnsUsages = usages.filter(
    usage => substance.original.usage && substance.original.usage[usage.id],
  )
  const newData: Record<string, number> = {}
  substance.original.usage?.forEach((value, index) => {
    newData[`usage-${index}`] = Number(value)
  })

  const columns = composeColumnsByUsages(columnsUsages)

  const usagesTable = useReactTable({
    data: [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="relative overflow-x-auto shadow-md p-3">
      <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          {usagesTable.getHeaderGroups().map(headerGroup => (
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
          {usagesTable.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="dark:border-gray-600">
              {headerGroup.headers.map(header => (
                <td key={header.id} className="border-b px-2 py-2">
                  {newData[header.id] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const composeColumnsByUsages = (usages: Usage[]): any[] => {
  const columns = []
  for (let i = 0; i < usages.length; i++) {
    columns.push({
      header: usages[i].name,
      accessorKey: `usage-${usages[i].id}`,
    })
  }

  return columns
}
