import React, { useContext, ChangeEvent } from 'react'

import { TextField, Divider } from '@mui/material'
import Typography from '@mui/material/Typography'

import { CPBaseForm } from '@ors/components/manage/Blocks/CountryProgramme/typesCPCreate'
import CloneSubstancesDialog from '@ors/components/manage/Blocks/Section/ReportInfo/Create/CloneSubstancesDialog'
import { FilesViewer } from '@ors/components/manage/Blocks/Section/ReportInfo/FilesViewer'
import ReportHistory from '@ors/components/manage/Blocks/Section/ReportInfo/ReportHistory'
import ReportStatus from '@ors/components/manage/Blocks/Section/ReportInfo/ReportStatus'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { useStore } from '@ors/store'

import PermissionsContext from '@ors/contexts/PermissionsContext'

import { IoTrash } from 'react-icons/io5'
import { BsFilesAlt } from 'react-icons/bs'

function FileInput(props: {
  form: CPBaseForm
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
}) {
  const { form, setForm } = props

  const selectedFiles = form.files

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setForm((oldForm) => {
        return { ...oldForm, files: Array.from(event.target.files || []) }
      })
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
            <>
              {selectedFiles.length > 0 && (
                <IconButton
                  className="h-full rounded-none border-y-0 border-r-0"
                  onClick={() =>
                    setForm((oldForm) => {
                      return { ...oldForm, files: [] }
                    })
                  }
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

const CountrySelect: React.FC = (props: any) => {
  const { countryFieldProps, isEdit, report, user_country } = props

  const { isCPCountryUserType } = useContext(PermissionsContext)

  if (isCPCountryUserType) {
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
        {...countryFieldProps}
        FieldProps={{ className: 'mb-0 ReportInfo' }}
        defaultValue={isEdit ? report.country : null}
        disabled={isEdit}
      />
    </>
  )
}

const ReportInfoCreate = (props: any) => {
  const {
    Sections,
    countryFieldProps,
    form,
    isCreate,
    isEdit,
    onSectionCheckChange,
    report,
    section,
    sectionsChecked,
    setForm,
    showCloneDialog,
    yearFieldProps,
  } = props
  const { country: user_country, username } = useStore(
    (state) => state.user.data,
  )
  const alreadyUploadedFiles = useStore(
    (state: any) => state?.cp_reports?.report?.files?.data,
  )

  const updateForm = (event: { target: { value: any } }, key: string) =>
    setForm({
      ...form,
      report_info: {
        ...form.report_info,
        [key]: event.target.value,
      },
    })

  const user_fullname = form.report_info.reporting_entry
  const user_email = form.report_info.reporting_email

  return (
    <section className="grid items-start gap-4 md:auto-rows-auto md:grid-cols-2">
      <Typography className="md:col-span-2" component="h2" variant="h6">
        {section.title}
      </Typography>

      <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
        <HeaderWithIcon title="Summary" Icon={BsFilesAlt} />
        <SimpleField
          id="username"
          data={username}
          label="Username"
          textClassName="text-[1.25rem]"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <SimpleInput
            id="name_reporting_officer"
            label="Name of reporting officer"
            type="text"
            value={user_fullname}
            onChange={(event: any) => updateForm(event, 'reporting_entry')}
          />
          <SimpleInput
            id="email_reporting_officer"
            label="Email of reporting officer"
            type="email"
            value={user_email}
            onChange={(event: any) => updateForm(event, 'reporting_email')}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="h-full w-full items-center md:col-span-3">
            <div className="flex h-full flex-col justify-end">
              {showCloneDialog && (
                <CloneSubstancesDialog
                  Sections={Sections}
                  form={form}
                  setForm={setForm}
                />
              )}
              <CountrySelect
                // @ts-ignore
                countryFieldProps={countryFieldProps}
                form={form}
                isEdit={isEdit}
                report={report}
                setForm={setForm}
                user_country={user_country}
              />
            </div>
          </div>
          <div>
            <label
              className="mb-2 block text-lg font-normal text-gray-900"
              htmlFor={isEdit ? undefined : 'year'}
            >
              Reporting for year
            </label>
            <Field
              {...yearFieldProps}
              FieldProps={{ className: 'mb-0 ReportInfo' }}
              defaultValue={isEdit ? report.year : null}
              {...(isCreate ? { disableClearable: true } : {})}
              disabled={isEdit}
            />
          </div>
        </div>
        <FileInput form={form} setForm={setForm} />
        {isEdit && (
          <>
            <Divider />
            <FilesViewer
              files={alreadyUploadedFiles}
              heading={'Already uploaded files'}
              isEdit={isEdit}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
        <ReportStatus
          isCreate={isCreate}
          isEdit={isEdit}
          report={report}
          sectionsChecked={sectionsChecked}
          onSectionCheckChange={onSectionCheckChange}
        />
        {isEdit && (
          <>
            <Divider />
            <ReportHistory />
          </>
        )}
      </div>
    </section>
  )
}

export default ReportInfoCreate
