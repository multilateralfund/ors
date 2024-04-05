import React, { ChangeEvent, useState } from 'react'

import { TextField } from '@mui/material'
import Typography from '@mui/material/Typography'

import ReportHistory from '@ors/components/manage/Blocks/Section/ReportInfo/ReportHistory'
import ReportStatus from '@ors/components/manage/Blocks/Section/ReportInfo/ReportStatus'
import Field from '@ors/components/manage/Form/Field'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import { useStore } from '@ors/store'

const FileInput: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files)
      setSelectedFiles(filesArray)
    }
  }

  const formatFileNames = () => {
    return selectedFiles.map((file) => file.name).join('; ')
  }

  return (
    <div className="flex flex-col">
      <span className="mb-2 text-2xl font-normal">File attachments</span>
      <TextField
        type="text"
        variant="standard"
        InputProps={{
          className:
            'flex bg-white rounded-lg border border-solid border-gray-400 pl-2 h-[40px]',
          disableUnderline: true,
          endAdornment: (
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
                // onChange={handleUpload}
              />
              Browse files
            </IconButton>
          ),
          readOnly: true,
        }}
        value={
          selectedFiles.length === 0 ? 'No files selected' : formatFileNames()
        }
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

const SimpleInput = ({
  id,
  defaultValue,
  label,
  type,
}: {
  defaultValue?: any
  id: string
  label: string
  type: string
}) => {
  return (
    <div>
      <label
        className="mb-2 block text-lg font-normal text-gray-900"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="text-md block h-10 w-full rounded-lg border border-solid border-gray-400 bg-white p-2.5 text-gray-900 shadow-none focus:border-blue-500 focus:ring-blue-500"
        autoComplete="off"
        type={type}
        value={defaultValue}
      />
    </div>
  )
}

const SimpleField = ({
  id,
  data,
  hasName,
  label,
}: {
  data: string
  hasName?: boolean
  id: string
  label: string
}) => {
  return (
    <div>
      <label className="block text-lg font-normal text-gray-900" htmlFor={id}>
        {label}
      </label>
      <p className="my-0 text-xl font-semibold">{data}</p>
      {hasName && (
        <input id={id} name={id} type="text" value={data} hidden readOnly />
      )}
    </div>
  )
}

const ReportInfoCreate = (props: any) => {
  const { fieldProps, form, isEdit, section } = props
  const user = useStore((state) => state.user)
  console.log(user.data)
  console.log(fieldProps)

  return (
    <section className="grid items-start gap-4 md:auto-rows-auto md:grid-cols-2">
      <Typography className="md:col-span-2" component="h2" variant="h6">
        {section.title}
      </Typography>

      <div className="flex flex-col gap-4 rounded-lg bg-gray-100 p-4">
        <legend className="mb-2 text-2xl font-normal">Summary</legend>
        <SimpleField id="username" data={user.data.username} label="Username" />
        <div className="grid gap-6 md:grid-cols-2">
          <SimpleInput
            id="name_reporting_officer"
            label="Name of reporting officer"
            type="text"
          />
          <SimpleInput
            id="email_reporting_officer"
            defaultValue={user.data.email}
            label="Email of reporting officer"
            type="email"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="items-center md:col-span-3">
            <div>
              <label
                className="mb-2 block text-lg font-normal text-gray-900"
                htmlFor="country"
              >
                Country
              </label>
              <Field
                {...fieldProps}
                FieldProps={{ className: 'mb-0 bg-white' }}
                sx={{
                  backgroundColor: 'white',
                }}
              />
            </div>
          </div>
          <SimpleInput
            id="report_year"
            defaultValue={form.year}
            label="Reporting for year"
            type="number"
          />
        </div>
        <FileInput />
      </div>

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <ReportStatus />
        {isEdit && <ReportHistory />}
      </div>
    </section>
  )
}

export default ReportInfoCreate
