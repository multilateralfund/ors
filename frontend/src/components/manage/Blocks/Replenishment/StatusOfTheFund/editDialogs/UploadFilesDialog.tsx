import FormDialog from '../../FormDialog'
import { IUploadDocumentsProps } from '../types'
import {
  SearchableSelectInput,
  TextareaInput,
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

  return (
    <FormDialog
      title="Upload documents:"
      onCancel={onCancel}
      onSubmit={handleUploadDocuments}
      {...dialogProps}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <SearchableSelectInput
            field="year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
          />
          <SearchableSelectInput
            field="meeting_id"
            label="Meeting number"
            options={meetingOptions}
            placeholder="Select meeting number"
          />
        </div>
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <UploadDocumentsInput field={'files'} label={'Upload'} />
            <TextareaInput
              className="h-24 w-64"
              field={'comment'}
              label={'Comment'}
            />
          </div>
        </div>
      </div>
    </FormDialog>
  )
}

export default UploadFilesDialog
