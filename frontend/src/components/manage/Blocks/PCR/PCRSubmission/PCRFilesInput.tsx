import { useContext, ChangeEvent } from 'react'

import IconButton from '@ors/components/ui/IconButton/IconButton'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'

import { TextField } from '@mui/material'
import { map } from 'lodash'

const PCRFilesInput = ({ crtTab }: { crtTab: number }) => {
  const { files, setFiles, filesMetadata, setFilesMetadata } =
    useContext(PCRDataContext)

  const { addUpdatedField } = useUpdatedFields()

  const { newFiles = [] } = files[crtTab] || {}

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files

    if (inputFiles && inputFiles.length > 0) {
      const uploadedFiles = Array.from(inputFiles)

      const updatedFiles = map(files, (file, fileIndex) =>
        fileIndex === crtTab
          ? {
              ...file,
              newFiles: [...newFiles, ...uploadedFiles],
            }
          : file,
      )
      setFiles(updatedFiles)

      const updatedFilesMetadata = map(
        filesMetadata,
        (metadata, metadataIndex) => {
          const newFilesMetadata = uploadedFiles.map((file) => ({
            id: null,
            name: file.name,
            size: file.size,
            section: null,
          }))

          return metadataIndex === crtTab
            ? {
                ...metadata,
                filesMetadata: [
                  ...(metadata.filesMetadata ?? []),
                  ...newFilesMetadata,
                ],
              }
            : metadata
        },
      )
      setFilesMetadata(updatedFilesMetadata)

      addUpdatedField('files')
    }
  }

  return (
    <>
      <p className="mb-2.5 mt-0 text-xl">Upload other supporting evidence</p>
      <TextField
        fullWidth
        variant="standard"
        className="md:w-[612px]"
        value={newFiles.length === 0 ? 'No files selected' : ''}
        InputProps={{
          readOnly: true,
          disableUnderline: true,
          className:
            'bg-white rounded-lg border border-solid border-gray-400 pl-2 h-10',
          endAdornment: (
            <IconButton
              component="label"
              aria-label="upload files"
              className="flex h-full rounded-l-none border-y-0 border-r-0 !border-gray-400 px-3 py-2.5 text-xl font-normal normal-case !text-[#344054]"
            >
              <input
                type="file"
                id="file_attachments"
                name="file_attachments"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
                value={[]}
                onChange={handleFileChange}
                hidden
                multiple
              />
              Browse files
            </IconButton>
          ),
        }}
      />
      <p className="mt-1 text-sm text-gray-500">
        Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt,
        .pptx, .png, .jpg, .jpeg, .gif
      </p>
    </>
  )
}

export default PCRFilesInput
