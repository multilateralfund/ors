import { useState, useEffect } from 'react'
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
  selectChemicalBySection,
  selectUsagesBySection,
  selectBlends,
  setReports,
  updateReport,
  ReportDataType,
} from '@/slices/reportSlice'
import { Usage, Chemical, SectionsType } from '@/types/Reports'
import { FormInput } from '../form/FormInput'
import { FormDateSelect } from '../form/FormDateSelect'
import { Button } from './Button'
import { RootState } from '@/store'

type SelectedChemical = Chemical

export const ManageChemicalModal = ({
  show = false,
  editValues,
  withSection,
  sectionId,
  withBlends = false,
  onClose,
}: {
  show?: boolean
  editValues?: Partial<ReportDataType>
  withSection: Partial<SectionsType>
  sectionId: number
  withBlends?: boolean
  onClose?: () => void
}) => {
  const [currentChemical, setCurrentChemical] = useState<SelectedChemical>()
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

  const chemicals = useSelector((state: RootState) =>
    selectChemicalBySection(state, withSection),
  )
  const blends = useSelector(selectBlends)
  const usages = useSelector((state: RootState) =>
    selectUsagesBySection(state, withSection),
  )

  const selectedChemical = useWatch({
    control,
    name: 'substance',
  })

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
    if (selectedChemical) {
      const getChemical = withBlends
        ? blends.find(item => item.id === Number(selectedChemical))
        : chemicals
            .find(item =>
              item.options?.find(
                subst => subst.id === Number(selectedChemical),
              ),
            )
            ?.options?.find(subst => subst.id === Number(selectedChemical))

      if (getChemical) {
        setCurrentChemical({
          ...getChemical,
          ...{ blend: withBlends },
        } as SelectedChemical)

        setSelectedUsages(
          usages.filter(
            usage => !getChemical?.excluded_usages.includes(usage.id),
          ),
        )
      }
    }
  }, [selectedChemical])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
      if (onClose) onClose()
    }
  }, [isSubmitSuccessful, reset, onClose])

  const onSubmit = handleSubmit(values => {
    const valuesToUpdate = {
      sectionId: sectionId,
      values: {
        ...values,
        ...{ substance: currentChemical },
      },
    }

    if (editValues) {
      dispatch(updateReport(valuesToUpdate))
      return
    }

    dispatch(setReports(valuesToUpdate))
  })

  const modalTitle = withBlends ? 'blends' : 'substances'

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
      <Modal.Header>
        {editValues ? 'Edit' : 'Add'} {modalTitle}
      </Modal.Header>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Modal.Body>
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select chemical
                </label>
                <FormSelectBox
                  options={withBlends ? blends : chemicals}
                  withBlends={withBlends}
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
  withBlends = false,
  isDisabled = false,
}: {
  name: string
  options: any[]
  withBlends: boolean
  isDisabled: boolean
}) => {
  const { control } = useFormContext()

  const transformedOptions = withBlends
    ? options.map(item => ({ name: item.name, value: item.id }))
    : options.map(item => ({
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
        <SelectSearch
          {...field}
          options={transformedOptions}
          placeholder="Choose a chemical"
          disabled={isDisabled}
          search
        />
      )}
    />
  )
}
