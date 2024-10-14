import { useState } from 'react'

import { find } from 'lodash'

import FormDialog from '../../FormDialog'
import { IEditAllocationsProps } from '../types'
import { NumberInput, SelectInput, TextareaInput } from './editInputs'

const EditAllocationsDialog = (props: IEditAllocationsProps) => {
  const {
    agency,
    agencyOptions,
    allocations,
    meetingOptions,
    yearOptions,
    ...dialogProps
  } = props

  const [formState, setFormState] = useState({ agency: agency })

  const currentAgency = find(
    agencyOptions,
    (agencyOpt) => agencyOpt.value === agency,
  )

  const handleEditAllocationsSubmit = () => {
    console.log({ formState })
  }

  return (
    <FormDialog
      title={currentAgency?.label || ''}
      onSubmit={handleEditAllocationsSubmit}
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
            value={currentAgency?.value}
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
            <SelectInput
              field="year"
              label="Year"
              options={yearOptions}
              placeholder="Select year"
              setFormState={setFormState}
            />
            <NumberInput
              field="interest_earned"
              label="Amount"
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
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditAllocationsDialog
