import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { quarterOptions } from '../constants'
import { IEditIncomeDialogProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditInterestEarnedDialog = (props: IEditIncomeDialogProps) => {
  const { agencyOptions, allocations, data, yearOptions, ...dialogProps } =
    props

  const [formState, setFormState] = useState({})

  const handleEditInterestEarnedSubmit = () => {
    console.log({ formState })
  }

  return (
    <FormDialog
      title="Interest earned:"
      onSubmit={handleEditInterestEarnedSubmit}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SelectInput
            field="agency"
            label="Agency"
            options={agencyOptions}
            placeholder="Select agency"
            setFormState={setFormState}
          />
          <SelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
            setFormState={setFormState}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <SelectInput
              field="quarter"
              label="Quarter"
              options={quarterOptions}
              placeholder="Select quarter"
              setFormState={setFormState}
            />
            <NumberInput
              field="meeting_number"
              label="Meeting number"
              min="0"
              setFormState={setFormState}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <TextareaInput
              field="comment"
              label="Comment"
              setFormState={setFormState}
            />
            <NumberInput
              field="interest_earned"
              label="Amount"
              setFormState={setFormState}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditInterestEarnedDialog
