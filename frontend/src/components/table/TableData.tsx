import { useState, useEffect, useMemo } from 'react'
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
  Table,
  TableMeta,
  RowData,
} from '@tanstack/react-table'

type Reporting = {
  substance: {
    name: string
    value: string
    isEditable: boolean
  }
  aerosol: {
    name: string
    value: number
    isEditable: boolean
  }
  foam: {
    name: string
    value: number
    isEditable: boolean
  }
  fireFighting: {
    name: string
    value: number
    isEditable: boolean
  }
  manufOther: {
    name: string
    value: number
    isEditable: boolean
  }
  manufAc: {
    name: string
    value: number
    isEditable: boolean
  }
  manufTotal: {
    name: string
    value: number
    isEditable: boolean
  }
  servicing: {
    name: string
    value: number
    isEditable: boolean
  }
  solvent: {
    name: string
    value: number
    isEditable: boolean
  }
  other3: {
    name: string
    value: number
    isEditable: boolean
  }
  sectorTotal: {
    name: string
    value: number
    isEditable: boolean
  }
  import: {
    name: string
    value: number
    isEditable: boolean
  }
  export: {
    name: string
    value: number
    isEditable: boolean
  }
  production: {
    name: string
    value: number
    isEditable: boolean
  }
  importQuotas: {
    name: string
    value: number
    isEditable: boolean
  }
}

const defaultData: Reporting[] = [
  {
    substance: {
      name: 'HFC-32',
      value: 'HFC-32',
      isEditable: false,
    },
    aerosol: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    foam: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    fireFighting: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: false,
    },
    manufOther: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufAc: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    servicing: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    solvent: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    other3: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    sectorTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    import: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    export: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    production: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    importQuotas: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
  },
  {
    substance: {
      name: 'HFC-41',
      value: 'HFC-41',
      isEditable: false,
    },
    aerosol: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    foam: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    fireFighting: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: false,
    },
    manufOther: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufAc: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    servicing: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    solvent: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    other3: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    sectorTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    import: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    export: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    production: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    importQuotas: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
  },
  {
    substance: {
      name: 'HFC-125',
      value: 'HFC-125',
      isEditable: false,
    },
    aerosol: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    foam: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    fireFighting: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufOther: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufAc: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    manufTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    servicing: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    solvent: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    other3: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    sectorTotal: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    import: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    export: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    production: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
    importQuotas: {
      name: 'Aerosol',
      value: 0.0,
      isEditable: true,
    },
  },
]

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

const isNotEditable = ['substance']

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
            header: 'Other',
            accessorKey: 'other',
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
    defaultColumn: {
      cell({ getValue, row: { index, original }, column: { id }, table }) {
        const initialValue = original[id as keyof Reporting]?.value
        const isEditable = original[id as keyof Reporting]?.isEditable

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [value, setValue] = useState(initialValue)

        const onBlur = () => {
          table.options.meta?.updateData(index, id, value)
        }

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          setValue(initialValue)
        }, [initialValue])

        if (!isEditable) {
          return <span>{value}</span>
        }

        return (
          <input
            className="bg-gray-50 w-full p-1 text-right rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
          />
        )
      },
    },
    state: {
      grouping,
    },
    onGroupingChange: setGrouping,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        console.log(rowIndex, columnId, value)
      },
    },
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
