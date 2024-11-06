import { ChangeEvent } from 'react'

import { TextField } from '@mui/material'

import IconButton from '@ors/components/ui/IconButton/IconButton'

import { IoTrash } from 'react-icons/io5'

const FileInput = (props: {
  files?: FileList
  setFiles: React.Dispatch<React.SetStateAction<FileList | null>>
}) => {
  const { files, setFiles } = props

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files)
    }
  }

  return (
    <div className="flex flex-col">
      <TextField
        type="text"
        value={!files ? 'No files selected' : files?.[0]?.name}
        variant="standard"
        InputProps={{
          className:
            'flex bg-white rounded-lg border border-solid border-gray-400 pl-2 h-[40px]',
          disableUnderline: true,
          endAdornment: (
            <>
              {files && (
                <IconButton
                  className="h-full rounded-none border-y-0 border-r-0"
                  onClick={() => setFiles(null)}
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
