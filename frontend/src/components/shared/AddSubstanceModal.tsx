import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FormProvider, Controller, useForm } from 'react-hook-form'
import {
  selectSubstancesAnnexA,
  selectUsagesSectionA,
  setReports,
  updateReport,
} from '@/slices/reportSlice'
import Select from 'react-select'

import { Modal } from 'flowbite-react'
import { Usage, SectionsType } from '@/types/Reports'
import { FormInput } from '../form/FormInput'
import { FormDateSelect } from '../form/FormDateSelect'
import { Button } from '../shared/Button'

export const AddSubstancesModal = ({
  show = false,
  editValues,
  withSection,
  onClose,
}: {
  show?: boolean
  editValues?: boolean | unknown
  withSection: Partial<SectionsType>
  onClose?: () => void
}) => {
  const [selectedSubstance, setSelectedSubstance] = useState<{
    id: number
    label: string
    value: string
    excluded_usages: number[]
  } | null>(null)
  const [selectedUsages, setSelectedUsages] = useState<Usage[] | null>(null)
  const dispatch = useDispatch()

  const methods = useForm()
  const {
    reset,
    handleSubmit,
    control,
    formState: { isSubmitSuccessful },
    setValue,
  } = methods

  const substances = useSelector(selectSubstancesAnnexA)
  const usages = useSelector((state: any) =>
    selectUsagesSectionA(state, withSection),
  )

  useEffect(() => {
    if (show && editValues) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      setSelectedUsages(substance.usages)

      // Update form

      Object.keys(editValues).forEach(item => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        setValue(item, editValues[item])
      })
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
                          name={child.name.toLowerCase().replace(' ', '_')}
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
                name={usage.name.toLowerCase().replace(' ', '_')}
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

  const onSubmit = (values: any) => {
    if (editValues) {
      dispatch(updateReport(values))
      return
    }

    dispatch(setReports(values))
  }

  return (
    <Modal
      show={show}
      size="2xl"
      onClose={() => {
        reset()
        setSelectedSubstance(null)
        setSelectedUsages(null)
        if (onClose) onClose()
      }}
      position="top-center"
    >
      <Modal.Header>{editValues ? 'Edit' : 'Add'} substances</Modal.Header>
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
                  defaultValue={selectedSubstance}
                  name="substance"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      defaultValue={value}
                      onChange={value => {
                        setSelectedSubstance(value)
                        onChange(value.label)
                      }}
                      options={substances}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={editValues as boolean}
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
