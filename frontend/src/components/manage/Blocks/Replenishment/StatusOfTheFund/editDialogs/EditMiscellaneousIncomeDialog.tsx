import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IEditIncomeDialogProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditMiscellaneousIncomeDialog = (props: IEditIncomeDialogProps) => {
  const { agencyOptions, allocations, data, yearOptions, ...dialogProps } =
    props

  const [formState, setFormState] = useState({})

  const handleEditMiscellaneousIncomeSubmit = () => {
    console.log({ formState })
  }

  return (
    <FormDialog
      title="Miscellaneous income:"
      onSubmit={handleEditMiscellaneousIncomeSubmit}
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
          <NumberInput
            field="meeting_number"
            label="Meeting number"
            min="0"
            setFormState={setFormState}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <NumberInput
              field="interest_earned"
              label="Amount"
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

export default EditMiscellaneousIncomeDialog
