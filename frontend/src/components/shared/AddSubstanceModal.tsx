import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FormProvider, Controller, useForm } from 'react-hook-form'
import { Modal } from 'flowbite-react'
import Select from 'react-select'

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
  const [selectedSubstance, setSelectedSubstance] = useState<{
    id: number
    label: string
    excluded_usages: number[]
  } | null>()
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

  const substances: any = useSelector((state: RootState) =>
    selectSubstancesBySection(state, withSection),
  )
  const usages = useSelector((state: RootState) =>
    selectUsagesBySection(state, withSection),
  )

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
          setValue(key, editValues[key])
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
      setSelectedUsages(
        usages.filter(
          usage => !selectedSubstance.excluded_usages.includes(usage.id),
        ),
      )
    }
  }, [selectedSubstance])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      setSelectedSubstance(undefined)
      if (onClose) onClose()
    }
  }, [isSubmitSuccessful, reset, onClose])

  const ComposeInputsByUsage = () => {
    if (!selectedUsages) return null

    return (
      <>
        {selectedUsages.map(usage => {
          if (usage.children.length) {
            return (
              <div
                className="w-full text-left my-3 border-b pb-4"
                key={usage.id}
              >
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

  const onSubmit = handleSubmit(values => {
    if (editValues) {
      dispatch(
        updateReport({
          sectionId: sectionId,
          values,
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
        setSelectedSubstance(undefined)
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
                <Controller
                  control={control}
                  defaultValue={selectedSubstance}
                  name="substance"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      defaultValue={value}
                      onChange={value => {
                        setSelectedSubstance(value)
                        onChange(value?.label)
                      }}
                      options={substances}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={editValues as unknown as boolean}
                    />
                  )}
                />
              </div>
              {selectedUsages && <ComposeInputsByUsage />}
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
