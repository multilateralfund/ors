import { useState } from 'react'

import FormDialog from '../../FormDialog'
import { IUploadDocumentsProps } from '../types'
import {
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

  const [formData, setFormData] = useState({})

  return (
    <FormDialog
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
    </FormDialog>
  )
}

export default UploadFilesDialog
