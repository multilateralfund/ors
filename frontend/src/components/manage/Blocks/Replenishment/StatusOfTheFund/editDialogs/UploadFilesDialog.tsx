import FormEditDialog from '@ors/components/manage/Blocks/Replenishment/FormEditDialog'

import { IUploadFilesProps } from '../types'
import {
  PopoverInputField,
  SearchableSelectInput,
  SimpleInput,
  UploadFilesInput,
} from './editInputs'

const UploadFilesDialog = (props: IUploadFilesProps) => {
  const {
    handleUploadFiles,
    meetingOptions,
    onCancel,
    yearOptions,
    ...dialogProps
  } = props

  return (
    <FormEditDialog
      title="Upload files:"
      onCancel={onCancel}
      onSubmit={handleUploadFiles}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex gap-x-4">
          <SearchableSelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
          />
          <PopoverInputField
            field="meeting_id"
            label="Meeting"
            options={meetingOptions}
            placeholder="Select meeting"
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex gap-x-4">
            <UploadFilesInput field="files" label="Upload" />
            <SimpleInput field="comment" label="Comment" type="text-area" />
          </div>
        </div>
      </div>
    </FormEditDialog>
  )
}

export default UploadFilesDialog
