import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  FormProvider,
  Controller,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { Modal } from 'flowbite-react'
// eslint-disable-next-line import/no-named-as-default
import SelectSearch from 'react-select-search'

import {
  selectSubstancesBySection,
  selectUsagesBySection,
  setReports,
  updateReport,
  ReportDataType,
} from '@/slices/reportSlice'
import { Usage, SectionsType } from '@/types/Reports'
import { FormInput } from '../form/FormInput'
import { FormDateSelect } from '../form/FormDateSelect'
import { Button } from '../shared/Button'
import { RootState } from '@/store'

type SelectedSubstance = {
  id: number
  label: string
  excluded_usages: number[]
}

export const AddSubstancesModal = ({
  show = false,
  editValues,
  withSection,
  sectionId,
  onClose,
}: {
  show?: boolean
  editValues?: Partial<ReportDataType>
  withSection: Partial<SectionsType>
  sectionId: number
  onClose?: () => void
}) => {
  const [currentSubstance, setCurrentSubstance] = useState<
    SelectedSubstance | null | undefined
  >()
  const [selectedUsages, setSelectedUsages] = useState<Usage[] | null>(null)
  const dispatch = useDispatch()

  const methods = useForm<ReportDataType>()
  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitSuccessful },
    setValue,
  } = methods

  const substances = useSelector((state: RootState) =>
    selectSubstancesBySection(state, withSection),
  )
  const usages = useSelector((state: RootState) =>
    selectUsagesBySection(state, withSection),
  )

  const selectedSubstance = useWatch({
    control,
    name: 'substance',
  })

  const getSubstanceBySelection = () =>
    substances
      .find(item =>
        item.options?.find(subst => subst.id === Number(selectedSubstance)),
      )
      ?.options?.find(subst => subst.id === Number(selectedSubstance))

  useEffect(() => {
    if (show && editValues) {
      setSelectedUsages(
        usages.filter(
          usage => !editValues?.substance?.excluded_usages.includes(usage.id),
        ),
      )

      const values = Object.keys(editValues) as (keyof typeof editValues)[]

      values.forEach(key => {
        if (key !== 'usage') {
          if (key === 'substance') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setValue(key, editValues[key]?.id)
          } else {
            setValue(key, editValues[key])
          }
        }
      })
      if (editValues.usage) {
        editValues.usage.forEach((value, key) => {
          setValue(`usage.${key}`, value)
        })
      }
    }
  }, [editValues, show, setValue])

  useEffect(() => {
    if (selectedSubstance) {
      const getSubstance = substances
        .find(item =>
          item.options?.find(subst => subst.id === Number(selectedSubstance)),
        )
        ?.options?.find(subst => subst.id === Number(selectedSubstance))

      setCurrentSubstance(getSubstance)

      setSelectedUsages(
        usages.filter(
          usage => !getSubstance?.excluded_usages.includes(usage.id),
        ),
      )
    }
  }, [selectedSubstance])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      if (onClose) onClose()
    }
  }, [isSubmitSuccessful, reset, onClose])

  const onSubmit = handleSubmit(values => {
    console.log(currentSubstance)
    if (editValues) {
      dispatch(
        updateReport({
          sectionId: sectionId,
          values: {
            ...values,
            ...{ substance: currentSubstance },
          },
        }),
      )
      return
    }

    dispatch(
      setReports({
        sectionId: sectionId,
        values: {
          ...values,
          ...{ substance: selectedSubstance },
        },
      }),
    )
  })

  return (
    <Modal
      show={show}
      size="2xl"
      onClose={() => {
        reset()
        setSelectedUsages(null)
        if (onClose) onClose()
      }}
      position="top-center"
    >
      <Modal.Header>{editValues ? 'Edit' : 'Add'} substances</Modal.Header>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Modal.Body>
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select substance
                </label>
                <FormSelectBox
                  options={substances}
                  name="substance"
                  isDisabled={editValues as unknown as boolean}
                />
              </div>
              {selectedUsages && (
                <ComposeInputsByUsage selectedUsages={selectedUsages} />
              )}
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
            <Button type="submit">Submit</Button>
          </Modal.Footer>
        </form>
      </FormProvider>
    </Modal>
  )
}

const ComposeInputsByUsage = ({
  selectedUsages,
}: {
  selectedUsages: Usage[]
}) => {
  return (
    <>
      {selectedUsages.map(usage => {
        if (usage.children.length) {
          return (
            <div className="w-full text-left my-3 border-b pb-4" key={usage.id}>
              <div className="my-1 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
                <p className="mx-2 mb-0 text-sm text-center font-semibold dark:text-neutral-200">
                  {usage.name}
                </p>
              </div>
              <div className="flex flex-row w-full ">
                {usage.children.map((child, i: number) => {
                  return (
                    <div
                      className={`w-full ${
                        i + 1 === usage.children.length ? '' : 'mr-3'
                      }`}
                      key={child.id}
                    >
                      <FormInput
                        name={`usage.${child.id}`}
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
          <div key={usage.id}>
            <FormInput
              name={`usage.${usage.id}`}
              label={usage.name}
              inline
              type="number"
            />
          </div>
        )
      })}
    </>
  )
}

const FormSelectBox = ({
  name,
  options,
  isDisabled = false,
}: {
  name: string
  options: any[]
  isDisabled: boolean
}) => {
  const { control } = useFormContext()

  const transformedOptions = options.map(item => ({
    name: item.label,
    type: 'group',
    items: item.options?.map((subst: any) => ({
      value: subst.id,
      name: subst.label,
      excluded_usages: subst.excluded_usages,
    })),
  }))

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        // <select
        //   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        //   {...field}
        //   onChange={target => {
        //     field.onChange(JSON.parse(target.currentTarget.value))
        //   }}
        // >
        //   {options.map((option: any) => (
        //     <>
        //       {option?.options?.length ? (
        //         <optgroup key={option.label} label={option.label}>
        //           {option.options.map((opt: any) => {
        //             return (
        //               <option key={opt.id} value={JSON.stringify(opt)}>
        //                 {opt.label}
        //               </option>
        //             )
        //           })}
        //         </optgroup>
        //       ) : (
        //         <>
        //           {option.map((opt: any) => {
        //             return (
        //               <option key={opt.id} value={JSON.stringify(opt)}>
        //                 {opt.label}
        //               </option>
        //             )
        //           })}
        //         </>
        //       )}
        //     </>
        //   ))}
        // </select>
        <SelectSearch
          {...field}
          options={transformedOptions}
          placeholder="Choose a substance"
          disabled={isDisabled}
          search
        />
      )}
    />
  )
}
