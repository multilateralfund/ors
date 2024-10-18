import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { quarterOptions } from '../constants'
import { IEditIncomeDialogProps } from '../types'
import {
  NumberInput,
  SearchableSelectInput,
  SelectInput,
  SimpleInput,
} from './editInputs'

const EditInterestEarnedDialog = (props: IEditIncomeDialogProps) => {
  const {
    agencyOptions,
    allocations,
    handleSubmitEditDialog,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const [formData, setFormData] = useState({})

  return (
    <FormDialog
      title="Interest earned:"
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-income')}
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
          <SearchableSelectInput
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
            <SearchableSelectInput
              field="meeting_id"
              label="Meeting number"
              options={meetingOptions}
              placeholder="Select meeting number"
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field="interest_earned"
              label="Amount"
              setFormData={setFormData}
            />
            <SimpleInput
              field="comment"
              label="Comment"
              setFormData={setFormData}
              type="text-area"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditInterestEarnedDialog
