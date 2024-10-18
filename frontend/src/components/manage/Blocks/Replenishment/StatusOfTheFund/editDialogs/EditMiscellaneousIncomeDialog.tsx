import { useState } from 'react'

import { IEditMiscellaneousIncomeDialogProps } from '../types'
import FormDialog from './FormDialog'
import {
  NumberInput,
  PopoverInputField,
  SearchableSelectInput,
  SimpleInput,
} from './editInputs'

const EditMiscellaneousIncomeDialog = (
  props: IEditMiscellaneousIncomeDialogProps,
) => {
  const {
    handleSubmitEditDialog,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const [formData, setFormData] = useState<any>({})

  return (
    <FormDialog
      title="Miscellaneous income:"
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-income')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SearchableSelectInput
            field="year"
            label="Year"
            options={yearOptions}
            setFormData={setFormData}
          />
          <PopoverInputField
            field="meeting_id"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormData={setFormData}
            value={formData.meeting_id}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field="miscellaneous_income"
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

export default EditMiscellaneousIncomeDialog
