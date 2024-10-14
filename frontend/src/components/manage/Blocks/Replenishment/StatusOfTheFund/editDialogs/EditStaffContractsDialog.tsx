import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditStaffContractsProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditStaffContractsDialog = (props: IEditStaffContractsProps) => {
  const { meetingOptions, yearOptions, ...dialogProps } = props
  const currentYear = new Date().getFullYear()

  const [formState, setFormState] = useState({})

  const handleEditSecretariatSubmit = () => {
    console.log({ formState })
  }

  return (
    <FormDialog
      title="Secretariat:"
      onSubmit={handleEditSecretariatSubmit}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
            setFormState={setFormState}
          />
          <SelectInput
            field="meeting_number"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
            setFormState={setFormState}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`budget_${currentYear + 1}`}
              label={`Budget for ${currentYear + 1}`}
              setFormState={setFormState}
            />
            <NumberInput
              field={`budget_${currentYear + 2}`}
              label={`Budget for ${currentYear + 2}`}
              setFormState={setFormState}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field={`budget_${currentYear + 3}`}
              label={`Budget for ${currentYear + 3}`}
              setFormState={setFormState}
            />
            <TextareaInput
              field={'comment'}
              label={'Comment'}
              setFormState={setFormState}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditStaffContractsDialog
