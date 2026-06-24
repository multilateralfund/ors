import { ChangeEvent } from 'react'

import IconButton from '@ors/components/ui/IconButton/IconButton'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { FilesViewerProps } from '../interfaces'

import { TextField } from '@mui/material'
import { map } from 'lodash'

const FileInput = ({
  files = [],
  setFiles,
  setFilesMetaData,
  crtAgency,
}: FilesViewerProps) => {
  const { addUpdatedField } = useUpdatedFields()

  const { newFiles = [] } = files[crtAgency] || {}

  const extensionsListText =
    'Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .png, .jpg, .jpeg, .gif'

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFiles = Array.from(event.target.files)

      const updatedFiles = map(files, (fileEntry, index) =>
        index === crtAgency
          ? {
              ...fileEntry,
              newFiles: [...(newFiles || []), ...uploadedFiles],
            }
          : fileEntry,
      )
      setFiles?.(updatedFiles)

      setFilesMetaData?.((prev) =>
        prev.map((agency, index) =>
          index === crtAgency
            ? {
                ...agency,
                filesMetaData: [
                  ...(agency.filesMetaData ?? []),
                  ...uploadedFiles.map((file) => ({
                    id: null,
                    name: file.name,
                    size: file.size,
                    type: null,
                  })),
                ],
              }
            : agency,
        ),
      )

      addUpdatedField('files')
    }
  }

  return (
    <div className="flex flex-col">
      <p className="mb-2.5 mt-0 text-xl">Upload other supporting evidence</p>
      <TextField
        className="md:w-[612px]"
        type="text"
        value={newFiles.length === 0 ? 'No files selected' : ''}
        variant="standard"
        InputProps={{
          className:
            'flex bg-white rounded-lg border border-solid border-gray-400 pl-2 h-[40px]',
          disableUnderline: true,
          endAdornment: (
            <IconButton
              className="flex h-full items-center justify-center text-nowrap rounded-l-none border-y-0 border-r-0 !border-gray-400 bg-[#E8E9EB] px-3 py-2.5 text-xl font-normal normal-case !text-[#344054]"
              aria-label="upload files"
              component="label"
            >
              <input
                id="file_attachments"
                name="file_attachments"
                type="file"
                accept={
                  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif'
                }
                value={[]}
                onChange={handleFileChange}
                hidden
                multiple
              />
              Browse files
            </IconButton>
          ),
          readOnly: true,
        }}
        fullWidth
      />
      <p
        id="file_input_help"
        className="mt-1 text-pretty text-sm text-gray-500"
      >
        {extensionsListText}
      </p>
    </div>
  )
}

export default FileInput
