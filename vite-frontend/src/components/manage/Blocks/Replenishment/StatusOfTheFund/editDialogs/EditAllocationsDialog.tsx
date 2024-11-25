import { useState } from 'react'

import { find } from 'lodash'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'

import { IEditAllocationsProps } from '../types'
import {
  NumberInput,
  PopoverInputField,
  SearchableSelectInput,
  SelectInput,
  SimpleInput,
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
    (agencyOpt) =>
      agencyOpt.value.toUpperCase() === agency.toUpperCase().replace('_', ' '),
  )

  const [formData, setFormData] = useState<any>({
    agency_name: currentAgency?.value,
  })

  return (
    <FormEditDialog
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
          <PopoverInputField
            field="meeting_id"
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
            setFormData={setFormData}
            value={formData.meeting_id}
          />
        </div>
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
            value={formData[agency]}
            required
          />
        </div>
        <div className="flex gap-x-4">
          <SimpleInput
            field="comment"
            label="Comment"
            setFormData={setFormData}
            type="text-area"
          />
        </div>
      </div>
    </FormEditDialog>
  )
}

export default EditAllocationsDialog
