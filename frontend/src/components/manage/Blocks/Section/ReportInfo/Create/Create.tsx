import React, { ChangeEvent, useState } from 'react'

import { TextField } from '@mui/material'
import Typography from '@mui/material/Typography'

import ReportHistory from '@ors/components/manage/Blocks/Section/ReportInfo/ReportHistory'
import ReportStatus from '@ors/components/manage/Blocks/Section/ReportInfo/ReportStatus'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
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

const ReportInfoCreate = (props: any) => {
  const {
    fieldProps,
    form,
    isCreate,
    isEdit,
    onSectionCheckChange,
    report,
    section,
    sectionsChecked,
    setForm,
  } = props
  const {
    country: user_country,
    email,
    full_name,
    user_type,
    username,
  } = useStore((state) => state.user.data)

  const updateForm = (event: { target: { value: any } }, key: string) =>
    setForm({
      ...form,
      report_info: {
        ...form.report_info,
        [key]: event.target.value,
      },
    })

  const user_fullname = isEdit ? form.report_info.reporting_entry : full_name
  const user_email = isEdit ? form.report_info.reporting_email : email

  const CountrySelect: React.FC = () => {
    if (user_type === 'country_user') {
      return (
        <SimpleInput
          id="country"
          defaultValue={user_country}
          disabled={true}
          label="Country"
          type="string"
        />
      )
    }

    return (
      <>
        <label
          className="mb-2 block text-lg font-normal text-gray-900"
          htmlFor={isEdit ? undefined : 'country'}
        >
          Country
        </label>
        <Field
          {...fieldProps}
          FieldProps={{ className: 'mb-0 ReportInfo' }}
          defaultValue={isEdit ? report.country : null}
          disabled={isEdit}
        />
      </>
    )
  }

  return (
    <section className="grid items-start gap-4 md:auto-rows-auto md:grid-cols-2">
      <Typography className="md:col-span-2" component="h2" variant="h6">
        {section.title}
      </Typography>

      <div className="flex flex-col gap-4 rounded-lg bg-gray-100 p-4">
        <legend className="mb-2 text-2xl font-normal">Summary</legend>
        <SimpleField id="username" data={username} label="Username" />
        <div className="grid gap-6 md:grid-cols-2">
          <SimpleInput
            id="name_reporting_officer"
            defaultValue={user_fullname}
            label="Name of reporting officer"
            type="text"
            onChange={(event: any) => updateForm(event, 'reporting_entry')}
          />
          <SimpleInput
            id="email_reporting_officer"
            defaultValue={user_email}
            label="Email of reporting officer"
            type="email"
            onChange={(event: any) => updateForm(event, 'reporting_email')}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-full w-full items-center md:col-span-3">
            <div className="flex h-full flex-col justify-end">
              <CountrySelect />
            </div>
          </div>
          <SimpleInput
            id="report_year"
            defaultValue={isEdit ? report.year : form.year}
            disabled={true}
            label="Reporting for year"
            type="number"
          />
        </div>
        <FileInput />
      </div>

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <ReportStatus
          isCreate={isCreate}
          isEdit={isEdit}
          report={report}
          sectionsChecked={sectionsChecked}
          onSectionCheckChange={onSectionCheckChange}
        />
        {isEdit && <ReportHistory />}
      </div>
    </section>
  )
}

export default ReportInfoCreate
