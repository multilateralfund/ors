import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditStaffContractsProps } from '../types'
import { NumberInput, SearchableSelectInput, TextareaInput } from './editInputs'

const EditStaffContractsDialog = (props: IEditStaffContractsProps) => {
  const {
    handleSubmitEditDialog,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({})

  return (
    <FormDialog
      title="Secretariat:"
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-allocations')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
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
          <div className="flex gap-x-4">
            <NumberInput
              field={`staff_contracts_${currentYear + 1}`}
              label={`Staff contracts for ${currentYear + 1}`}
              setFormData={setFormData}
            />
            <NumberInput
              field={`staff_contracts_${currentYear + 2}`}
              label={`Staff contracts for ${currentYear + 2}`}
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`staff_contracts_${currentYear + 3}`}
              label={`Staff contracts for ${currentYear + 3}`}
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

export default EditStaffContractsDialog
