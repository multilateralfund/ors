import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditStaffContractsProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditTreasuryFeesDialog = (props: IEditStaffContractsProps) => {
  const { meetingOptions, onCancel, yearOptions, ...dialogProps } = props
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({})

  const handleEditTreasuryFeesSubmit = () => {
    console.log({ formData })
  }

  return (
    <FormDialog
      title="Treasury fees:"
      onCancel={onCancel}
      onSubmit={handleEditTreasuryFeesSubmit}
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
            field="meeting_number"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormData={setFormData}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`budget_${currentYear + 1}`}
              label={`Budget for ${currentYear + 1}`}
              setFormData={setFormData}
            />
            <NumberInput
              field={`budget_${currentYear + 2}`}
              label={`Budget for ${currentYear + 2}`}
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`budget_${currentYear + 3}`}
              label={`Budget for ${currentYear + 3}`}
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

export default EditTreasuryFeesDialog
