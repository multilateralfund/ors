import { useState } from 'react'

import { find } from 'lodash'

import FormDialog from '../../FormDialog'
import { IEditAllocationsProps } from '../types'
import {
  NumberInput,
  SearchableSelectInput,
  SelectInput,
  TextareaInput,
} from './editInputs'

const EditAllocationsDialog = (props: IEditAllocationsProps) => {
  const {
    agency,
    agencyOptions,
    allocations,
    handleSubmitEditDialog,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const currentAgency = find(
    agencyOptions,
    (agencyOpt) => agencyOpt.id === agency,
  )

  const [formData, setFormData] = useState({
    agency_name: currentAgency?.value,
  })

  return (
    <FormDialog
      title={currentAgency?.label || ''}
      onCancel={onCancel}
      onSubmit={() => handleSubmitEditDialog(formData, 'external-allocations')}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SelectInput
            field="agency_name"
            label="Agency"
            options={agencyOptions}
            placeholder="Select agency"
            setFormData={setFormData}
            value={currentAgency?.value}
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
            <SearchableSelectInput
              field="year"
              label="Year"
              options={yearOptions}
              placeholder="Select year"
              setFormData={setFormData}
            />
            <NumberInput
              field={agency}
              label="Amount"
              setFormData={setFormData}
            />
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <TextareaInput
              field="comment"
              label="Comment"
              setFormData={setFormData}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default EditAllocationsDialog
