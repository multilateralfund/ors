import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditMiscellaneousIncomeDialogProps } from '../types'
import { NumberInput, SearchableSelectInput, TextareaInput } from './editInputs'

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

  const [formData, setFormData] = useState({})

  return (
    <FormDialog
      title="Miscellaneous income:"
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-income')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <SearchableSelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
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
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
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
