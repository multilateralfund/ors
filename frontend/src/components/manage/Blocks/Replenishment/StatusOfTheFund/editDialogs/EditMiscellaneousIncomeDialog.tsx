import { useState } from 'react'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'

import { IEditMiscellaneousIncomeDialogProps } from '../types'
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
    <FormEditDialog
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
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
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
              value={formData.miscellaneous_income}
              required
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
    </FormEditDialog>
  )
}

export default EditMiscellaneousIncomeDialog
