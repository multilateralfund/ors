import { useState } from 'react'

import { get, isNil, keys, omitBy } from 'lodash'
import { useSnackbar } from 'notistack'

import { api } from '@ors/helpers'

import FormDialog from '../../FormDialog'
import { quarterOptions } from '../constants'
import { IEditIncomeDialogProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditInterestEarnedDialog = (props: IEditIncomeDialogProps) => {
  const {
    agencyOptions,
    allocations,
    invalidateDataFn,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const { enqueueSnackbar } = useSnackbar()

  const [formData, setFormData] = useState({})

  const handleEditInterestEarnedSubmit = () => {
    let formattedData = { ...formData }

    keys(formData).map((key) => {
      const value = get(formData, key)

      formattedData = {
        ...formattedData,
        [key]: !!value
          ? ['meeting', 'quarter', 'year'].includes(key)
            ? parseInt(value)
            : value
          : null,
      }
    })

    const cleanData = omitBy(formattedData, isNil)

    console.log({ cleanData })

    api('api/replenishment/external-income/', {
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
      title="Interest earned:"
      onCancel={onCancel}
      onSubmit={handleEditInterestEarnedSubmit}
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
          />
          <SelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
            setFormData={setFormData}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <SelectInput
              field="quarter"
              label="Quarter"
              options={quarterOptions}
              placeholder="Select quarter"
              setFormData={setFormData}
            />
            <SelectInput
              field="meeting"
              label="Meeting number"
              options={meetingOptions}
              placeholder="Select meeting number"
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
            <NumberInput
              field="interest_earned"
              label="Amount"
              setFormData={setFormData}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditInterestEarnedDialog
