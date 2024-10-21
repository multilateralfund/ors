import { useState } from 'react'

import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'

import { IUploadDocumentsProps } from '../types'
import {
  PopoverInputField,
  SearchableSelectInput,
  SimpleInput,
  UploadDocumentsInput,
} from './editInputs'

const UploadFilesDialog = (props: IUploadDocumentsProps) => {
  const {
    handleUploadDocuments,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  const [formData, setFormData] = useState<any>({})

  return (
    <FormEditDialog
      title="Upload documents:"
      onCancel={onCancel}
      onSubmit={handleUploadDocuments}
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
          <PopoverInputField
            field="meeting_id"
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
            setFormData={setFormData}
            value={formData.meeting_id}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <UploadDocumentsInput
              field="files"
              label="Upload"
              setFormData={setFormData}
            />
            <SimpleInput
              field="comment"
              label="Comment"
              setFormData={setFormData}
              type="text-area"
            />
          </div>
        </div>
      </div>
    </FormEditDialog>
  )
}

export default UploadFilesDialog
