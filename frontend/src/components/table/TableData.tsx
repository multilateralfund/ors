import { useState, useMemo } from 'react'
import {
  flexRender,
  GroupingState,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  ColumnDef,
} from '@tanstack/react-table'

type Reporting = {
  substance: string
  aerosol: number
  foam: number
  fireFighting: number
  manufOther: number
  manufAc: number
  manufTotal: number
  servicing: number
  solvent: number
  other3: number
  sectorTotal: number
  import: number
  export: number
  production: number
  importQuotas: number
}

const defaultData: Reporting[] = [
  {
    substance: 'HFC-32',
    aerosol: 0.0,
    foam: 0.0,
    fireFighting: 0.0,
    manufOther: 0.0,
    manufAc: 0.0,
    manufTotal: 0.0,
    servicing: 0.0,
    solvent: 0.0,
    other3: 0.0,
    sectorTotal: 0.0,
    import: 0.0,
    export: 0.0,
    production: 0.0,
    importQuotas: 0.0,
  },
  {
    substance: 'HFC-41',
    aerosol: 0.0,
    foam: 0.0,
    fireFighting: 0.0,
    manufOther: 0.0,
    manufAc: 0.0,
    manufTotal: 0.0,
    servicing: 0.0,
    solvent: 0.0,
    other3: 0.0,
    sectorTotal: 0.0,
    import: 0.0,
    export: 0.0,
    production: 0.0,
    importQuotas: 0.0,
  },
  {
    substance: 'HFC-125',
    aerosol: 0.0,
    foam: 0.0,
    fireFighting: 0.0,
    manufOther: 0.0,
    manufAc: 0.0,
    manufTotal: 0.0,
    servicing: 0.0,
    solvent: 0.0,
    other3: 0.0,
    sectorTotal: 0.0,
    import: 0.0,
    export: 0.0,
    production: 0.0,
    importQuotas: 0.0,
  },
]

export const TableData = () => {
  const [data, setData] = useState(() => [...defaultData])
  const [grouping, setGrouping] = useState<GroupingState>([])

  const columns = useMemo<ColumnDef<Reporting>[]>(
    () => [
      {
        header: 'Substance',
        accessorKey: 'substance',
      },
      {
        header: 'Use by Sector',
        columns: [
          {
            accessorKey: 'aerosol',
            header: 'Aerosol',
          },
          {
            accessorKey: 'foam',
            header: 'Foam',
          },
          {
            accessorKey: 'fireFighting',
            header: 'Fire Fighting',
          },
          {
            header: 'Refrigeration',
            columns: [
              {
                header: 'Manufacturing',
                columns: [
                  {
                    header: 'Other',
                    accessorKey: 'manufOther',
                  },
                  {
                    header: 'AC',
                    accessorKey: 'manufAc',
                  },
                  {
                    header: 'Total',
                    accessorKey: 'manufTotal',
                  },
                ],
              },
              {
                header: 'Servicing',
                accessorKey: 'servicing',
              },
            ],
          },
          {
            heder: 'Solvent',
            accessorKey: 'solvent',
          },
          {
            header: 'Other3',
            accessorKey: 'other3',
          },
          {
            header: 'TOTAL',
            accessorKey: 'sectorTotal',
          },
        ],
      },
      {
        header: 'Import',
        accessorKey: 'import',
      },
      {
        header: 'Export',
        accessorKey: 'export',
      },
      {
        header: 'Production',
        accessorKey: 'production',
      },
      {
        header: 'Import quotas',
        accessorKey: 'importQuotas',
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
    },
    onGroupingChange: setGrouping,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // debugTable: true,
  })

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="">
        <div className="relative overflow-hidden bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 border-2">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          scope="col"
                          className="px-2 py-1 border text-center"
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              <div>
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
                  <tr
                    key={row.id}
                    className="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {row.getVisibleCells().map(cell => {
                      return (
                        <td key={cell.id} className="px-2 py-4">
                          {cell.getIsGrouped() ? (
                            <></>
                          ) : cell.getIsAggregated() ? (
                            // If the cell is aggregated, use the Aggregated
                            // renderer for cell
                            flexRender(
                              cell.column.columnDef.aggregatedCell ??
                                cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          ) : cell.getIsPlaceholder() ? null : ( // For cells with repeated values, render null
                            // Otherwise, just render the regular cell
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
