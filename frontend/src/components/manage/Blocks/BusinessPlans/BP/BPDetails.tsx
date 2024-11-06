import { ChangeEvent, useContext } from 'react'

import { TextField } from '@mui/material'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

import { FilesViewer } from '../FilesViewer'

import { IoTrash } from 'react-icons/io5'

function BPHistory() {
  const { data } = useContext(BPContext) as any
  const history = data?.results?.history
  return (
    <VersionHistoryList
      currentDataVersion={1}
      historyList={history}
      length={3}
      type="bp"
    />
  )
}

function BPSummary(props: {
  business_plan: any
  files: any
  isEdit?: boolean
  setFiles: React.Dispatch<React.SetStateAction<any>>
}) {
  const { business_plan, files, isEdit = false, setFiles } = props
  const { data } = useContext(BPContext) as any

  const business_plann = business_plan ?? (data?.results.business_plan || {})
  const { agency, year_start } = business_plann

  function FileInput() {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        setFiles(event.target.files)
      }
    }

    return (
      <div className="flex flex-col">
        <span className="mb-2 text-2xl font-normal">File attachments</span>
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

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField
          id="name_reporting_officer"
          data={'Name'}
          label="Name of reporting officer"
        />
        <SimpleField id="agency" data={agency?.name} label="Agency" />
        <SimpleField id="year" data={year_start} label="Year" />
      </div>
      {isEdit ? (
        <>
          <FileInput />
          <FilesViewer
            business_plan={business_plann}
            heading={'Currently uploaded file'}
          />
        </>
      ) : (
        <FilesViewer
          business_plan={business_plann}
          heading={'File attachments'}
        />
      )}
    </div>
  )
}

export default function BPDetails(props: any) {
  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <BPSummary {...props} />

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <BPHistory />
      </div>
    </section>
  )
}
