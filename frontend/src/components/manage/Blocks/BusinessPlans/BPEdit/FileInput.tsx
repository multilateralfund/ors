import { ChangeEvent } from 'react'

import { TextField } from '@mui/material'

import IconButton from '@ors/components/ui/IconButton/IconButton'

import { BpFileInput } from '../types'

import { IoTrash } from 'react-icons/io5'

const FileInput = (props: BpFileInput) => {
  const { files, setFiles } = props
  const { newFiles = [] } = files || {}

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (setFiles && event.target.files && event.target.files.length > 0) {
      setFiles({ ...files, newFiles: Array.from(event.target.files) })
    }
  }

  const formatFileNames = () => {
    return newFiles.map((file: File) => file.name).join('; ')
  }

  const handleClearInput = () => {
    if (setFiles) {
      setFiles({ ...files, newFiles: [] })
    }
  }

  return (
    <div className="flex flex-col">
      <TextField
        type="text"
        value={newFiles.length === 0 ? 'No files selected' : formatFileNames()}
        variant="standard"
        InputProps={{
          className:
            'flex bg-white rounded-lg border border-solid border-gray-400 pl-2 h-[40px]',
          disableUnderline: true,
          endAdornment: (
            <>
              {newFiles.length > 0 && (
                <IconButton
                  className="h-full rounded-none border-y-0 border-r-0"
                  onClick={handleClearInput}
                >
                  <IoTrash
                    className="transition-colors ease-in-out hover:text-mlfs-purple"
                    size={16}
                  />
                </IconButton>
              )}
              <IconButton
                className="flex h-full items-center justify-center text-nowrap rounded-l-none border-y-0 border-r-0 border-gray-400 text-lg font-normal"
                aria-label="upload files"
                component="label"
              >
                <input
                  id="file_attachments"
                  name="file_attachments"
                  type="file"
                  accept="image/*, application/pdf, application/msword,
                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,
                .zip, .rar"
                  onChange={handleFileChange}
                  hidden
                  multiple
                />
                Browse files
              </IconButton>
            </>
          ),
          readOnly: true,
        }}
        fullWidth
      />
      <p
        id="file_input_help"
        className="mt-1 text-pretty text-sm text-gray-900"
      >
        Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt,
        .pptx, .jpg, .jpeg, .png, .gif, .zip, .rar, .7z
      </p>
    </div>
  )
}

export default FileInput