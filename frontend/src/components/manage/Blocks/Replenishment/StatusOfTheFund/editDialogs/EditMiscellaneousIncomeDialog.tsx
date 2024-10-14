import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditIncomeDialogProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditMiscellaneousIncomeDialog = (props: IEditIncomeDialogProps) => {
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
      title="Miscellaneous income:"
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-income')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
            setFormData={setFormData}
          />
          <SelectInput
            field="meeting_id"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormData={setFormData}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field="miscellaneous_income"
              label="Amount"
              setFormData={setFormData}
            />
            <TextareaInput
              field={'comment'}
              label={'Comment'}
              setFormData={setFormData}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditMiscellaneousIncomeDialog
