import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditSecretariatProps } from '../types'
import { NumberInput, SearchableSelectInput, SimpleInput } from './editInputs'

const EditSecretariatDialog = (props: IEditSecretariatProps) => {
  const {
    field,
    handleSubmitEditDialog,
    label,
    meetingOptions,
    onCancel,
    ...dialogProps
  } = props
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({})

  return (
    <FormDialog
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-allocations')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SearchableSelectInput
            field="meeting_id"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormData={setFormData}
          />
          <SimpleInput
            field="decision_number"
            label="Decision number"
            setFormData={setFormData}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`${field}_${currentYear}`}
              label={`${currentYear} ${label}`}
              setFormData={setFormData}
            />
            <NumberInput
              field={`${field}_${currentYear + 1}`}
              label={`${currentYear + 1} ${label}`}
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`${field}_${currentYear + 2}`}
              label={`${currentYear + 2} ${label}`}
              setFormData={setFormData}
            />
            <NumberInput
              field={`${field}_${currentYear + 3}`}
              label={`${currentYear + 3} ${label}`}
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
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

export default EditSecretariatDialog
