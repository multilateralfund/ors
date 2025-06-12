import { ChangeEvent, Dispatch, SetStateAction, useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { NavigationButton } from './NavigationButton'
import { getCurrentPeriodOption } from '../utils'
import { uploadFiles } from '@ors/helpers'

import { IoInformationCircleOutline } from 'react-icons/io5'
import { BiTrash } from 'react-icons/bi'
import { FiFileText } from 'react-icons/fi'
import { Button, Alert } from '@mui/material'
import cx from 'classnames'

interface IBPImport {
  file: FileList | null
  filters: any
  setCurrentStep: Dispatch<SetStateAction<number>>
  setFile: Dispatch<SetStateAction<FileList | null>>
  setValidations: Dispatch<SetStateAction<any>>
  periodOptions: any[]
}

const BPImport = ({
  file,
  filters,
  setCurrentStep,
  setFile,
  setValidations,
  periodOptions,
}: IBPImport) => {
  const { canValidateUploadBp } = useContext(PermissionsContext)

  const currentPeriod = getCurrentPeriodOption(
    periodOptions,
    filters?.year_start,
  )
  const { bp_status, decision, meeting, year_end, year_start } = filters

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files)
    }
  }

  const validateBP = async () => {
    try {
      const baseUrl = `api/business-plan/upload/validate/?year_start=${year_start}&year_end=${year_end}&status=${bp_status}&meeting_id=${meeting}`

      const formattedUrl = decision
        ? baseUrl + `&decision_id=${decision}`
        : baseUrl

      if (file) {
        const result = await uploadFiles(formattedUrl, [file[0]], true)

        setValidations(result.response)
        setCurrentStep((step) => step + 1)
      }
    } catch (error: any) {
      console.error('Error:', error)
    }
  }

  return (
    <div key={JSON.stringify(file)}>
      <p className="m-0 text-2xl">Upload file</p>
      <div className="flex flex-wrap gap-5">
        <Button
          className="h-10 w-fit whitespace-nowrap border border-solid border-primary px-3 py-1 hover:text-white"
          aria-label="upload files"
          component="label"
          size="large"
          variant="contained"
        >
          <input
            id="file_attachments"
            name="file_attachments"
            accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            type="file"
            onChange={handleFileChange}
            hidden
          />
          Browse files
        </Button>
        {file && (
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex flex-wrap items-center gap-2.5 font-medium">
              <FiFileText
                className="min-h-5 min-w-5 text-secondary"
                size={20}
              />
              <a
                className="m-0 flex items-center gap-2 no-underline"
                download={file[0]?.name}
                href={URL.createObjectURL(file[0])}
              >
                <p className="mb-0 mt-0.5 text-xl text-primary">
                  {file[0]?.name}
                </p>
              </a>
              <BiTrash
                className="min-h-5 min-w-5 cursor-pointer text-gray-700"
                size={20}
                onClick={() => setFile(null)}
              />
            </div>
          </div>
        )}
      </div>
      {canValidateUploadBp &&
        file &&
        currentPeriod?.status.includes(filters?.bp_status) && (
          <Alert className="BPAlert mt-2 w-fit border-0" severity="warning">
            <p className="m-0 text-lg">
              You are about to overwrite the existing data from this Business
              Plan. Old versions are not kept in the system. Would you like to
              continue?
            </p>
          </Alert>
        )}
      {!canValidateUploadBp && (
        <Alert
          className="mt-3 w-fit"
          icon={<IoInformationCircleOutline size={24} />}
          severity="error"
        >
          <p className="m-0 text-lg">
            You are not authorized to validate business plans!
          </p>
        </Alert>
      )}
      <div className="flex items-center gap-2.5">
        <Button
          className={cx('mt-5 h-10 px-3 py-1', {
            'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
              file && canValidateUploadBp,
          })}
          disabled={!file || !canValidateUploadBp}
          size="large"
          variant="contained"
          onClick={validateBP}
        >
          Upload
        </Button>
        <NavigationButton {...{ setCurrentStep }} direction={'back'} />
      </div>
    </div>
  )
}

export default BPImport
