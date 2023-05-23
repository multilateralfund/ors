import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  FormProvider,
  SubmitHandler,
  Controller,
  useForm,
} from 'react-hook-form'
import {
  selectSubstancesAnnexA,
  setReports,
  selectRecordsData,
} from '@/slices/reportSlice'
import Select from 'react-select'

import { Modal } from 'flowbite-react'
import { FormInput } from '../form/FormInput'
import { FormDateSelect } from '../form/FormDateSelect'

import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  ColumnDef,
} from '@tanstack/react-table'
import { Button } from '../shared/Button'

type Reporting = any

const defaultData: Reporting[] = []

const RECORDS = [
  {
    name: 'CFC-11',
    id: 1,
    usages: [
      {
        name: 'Aerosol',
        id: 12,
      },
      {
        name: 'Foam',
        id: 121,
      },
      {
        name: 'Refrigeration',
        id: 122,
        children: [
          {
            name: 'Manufacturing',
            id: 1234,
          },
          {
            name: 'Servicing',
            id: 12222,
          },
        ],
      },
    ],
  },
  {
    name: 'CFC-113',
    id: 2,
    usages: [
      {
        name: 'Solvent',
        id: 12,
      },
      {
        name: 'Process agent',
        id: 121,
      },
      {
        name: 'Lab Use',
        id: 121,
      },
    ],
  },
]

export const TableData = () => {
  // const [data, setData] = useState(() => [...defaultData])
  const [showModal, setShowModal] = useState(false)
  const data = useSelector(selectRecordsData)

  const columns = useMemo<ColumnDef<unknown>[]>(
    () => [
      {
        header: 'Substances',
        accessorKey: 'substance',
      },
      {
        header: 'Aerosol',
        accessorKey: 'aerosol',
      },
      {
        header: 'Foam',
        accessorKey: 'foam',
      },
      {
        header: 'Fire Fighting',
        accessorKey: 'fire',
      },
      {
        header: 'Refrigeration',
        columns: [
          {
            header: 'Manufacturing',
            accessorKey: 'manufacturing',
          },
          {
            header: 'Servicing',
            accessorKey: 'servicing',
          },
        ],
      },
      {
        header: 'Solvent',
        accessorKey: 'solvent',
      },
      {
        header: 'Process agent',
        accessorKey: 'agent',
      },
      {
        header: 'Lab Use',
        accessorKey: 'lab_use',
      },
      {
        header: 'Methy Bromide',
        columns: [
          {
            header: 'QPS',
            accessorKey: 'qps',
          },
          {
            header: 'Non-QPS',
            accessorKey: 'non-qps',
          },
        ],
      },
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
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
        <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
          <div className="mx-auto">
            <TableHeaderActions onAddSubstances={() => setShowModal(true)} />
            <div className="overflow-hidden">
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
      <AddSubstancesModal
        show={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
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

const AddSubstancesModal = ({
  show = false,
  onClose,
}: {
  show?: boolean
  onClose?: () => void
}) => {
  const [selectedOption, setSelectedOption] = useState<any>(null)
  const [selectedRecords, setSelectedRecords] = useState<any>(null)
  const dispatch = useDispatch()

  const methods = useForm()
  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitSuccessful },
  } = methods

  const substances = useSelector(selectSubstancesAnnexA)

  useEffect(() => {
    if (selectedOption) {
      const substance = RECORDS.find(item => item.id === selectedOption.value)
      setSelectedRecords(substance?.usages)
    }
  }, [selectedOption])

  useEffect(() => {
    if (isSubmitSuccessful) reset()
  }, [isSubmitSuccessful, reset])

  const ComposeInputsByUsage = () => {
    if (!selectedRecords) return null

    return (
      <>
        {selectedRecords.map((record: any) => {
          if (record.children) {
            return (
              <div
                className="w-full text-left my-3 border-b pb-4"
                key={record.id}
              >
                <div className="my-1 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
                  <p className="mx-2 mb-0 text-sm text-center font-semibold dark:text-neutral-200">
                    {record.name}
                  </p>
                </div>
                <div className="flex flex-row w-full ">
                  {record.children.map((child: any, i: number) => {
                    return (
                      <div
                        className={`w-full ${
                          i + 1 === record.children.length ? '' : 'mr-3'
                        }`}
                        key={child.id}
                      >
                        <FormInput
                          name={child.name.toLowerCase()}
                          label={child.name}
                          type="number"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
          return (
            <div key={record.id}>
              <FormInput
                name={record.name.toLowerCase()}
                label={record.name}
                inline
                type="number"
              />
            </div>
          )
        })}
      </>
    )
  }

  const onSubmit = (values: any) => {
    dispatch(setReports(values))
  }

  return (
    <Modal show={show} size="2xl" onClose={onClose} position="top-center">
      <Modal.Header>Add substances</Modal.Header>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(d => onSubmit(d))}>
          <Modal.Body>
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select substance
                </label>
                <Controller
                  control={control}
                  defaultValue={selectedOption}
                  name="substance"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      defaultValue={value}
                      onChange={value => {
                        setSelectedOption(value)
                        onChange(value.label)
                      }}
                      options={substances}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
              </div>
              {selectedOption && <ComposeInputsByUsage />}
              <div className="flex flex-col gap-2 mt-3">
                <div>
                  <FormInput
                    name="import"
                    label="Import"
                    inline
                    type="number"
                  />
                </div>
                <div>
                  <FormInput
                    name="export"
                    label="Export"
                    inline
                    type="number"
                  />
                </div>
                <div>
                  <FormInput
                    name="production"
                    label="Production"
                    inline
                    type="number"
                  />
                </div>
                <div>
                  <FormInput
                    name="import_quotas"
                    label="Import quotas"
                    inline
                    type="number"
                  />
                </div>
                <div>
                  <FormDateSelect
                    name="import_banned"
                    label="If imports are banned"
                    tooltip="Indicate date ban commenced (DD/MM/YYYY)"
                    showPopperArrow={false}
                    inline
                  />
                </div>
                <div>
                  <FormInput name="remarks" label="Remarks" inline />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => console.log('saved')}>
              Add and close modal
            </Button>
            <Button onClick={() => console.log('saved')}>Add more</Button>
          </Modal.Footer>
        </form>
      </FormProvider>
    </Modal>
  )
}
