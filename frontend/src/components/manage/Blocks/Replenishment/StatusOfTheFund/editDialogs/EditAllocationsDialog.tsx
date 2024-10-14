import { useState } from 'react'

import { find, get, isNil, keys, omitBy } from 'lodash'
import { useSnackbar } from 'notistack'

import { api } from '@ors/helpers'

import FormDialog from '../../FormDialog'
import { IEditAllocationsProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditAllocationsDialog = (props: IEditAllocationsProps) => {
  const {
    agency,
    agencyOptions,
    allocations,
    invalidateDataFn,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const { enqueueSnackbar } = useSnackbar()

  const currentAgency = find(
    agencyOptions,
    (agencyOpt) => agencyOpt.id === agency,
  )

  const [formData, setFormData] = useState({
    agency_name: currentAgency?.value,
  })

  const handleEditAllocationsSubmit = () => {
    let formattedData = { ...formData }

    keys(formData).map((key) => {
      const value = get(formData, key)

      formattedData = {
        ...formattedData,
        [key]: !!value
          ? ['meeting', 'year'].includes(key)
            ? parseInt(value)
            : value
          : null,
      }
    })

    const cleanData = omitBy(formattedData, isNil)

    console.log({ cleanData })

    api('api/replenishment/external-allocations/', {
      data: cleanData,
      method: 'POST',
    })
      .then(() => {
        invalidateDataFn({
          cache_bust: crypto.randomUUID(),
        })
        enqueueSnackbar('Data updated successfully', { variant: 'success' })
        onCancel()
      })
      .catch(() => {
        enqueueSnackbar('Failed to update data', { variant: 'error' })
      })
  }

  return (
    <FormDialog
      title={currentAgency?.label || ''}
      onCancel={onCancel}
      onSubmit={handleEditAllocationsSubmit}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SelectInput
            field="agency_name"
            label="Agency"
            options={agencyOptions}
            placeholder="Select agency"
            setFormData={setFormData}
            value={currentAgency?.value}
          />
          <SelectInput
            field="meeting"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormData={setFormData}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <SelectInput
              field="year"
              label="Year"
              options={yearOptions}
              placeholder="Select year"
              setFormData={setFormData}
            />
            <NumberInput
              field={agency}
              label="Amount"
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <TextareaInput
              field="comment"
              label="Comment"
              setFormData={setFormData}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditAllocationsDialog
