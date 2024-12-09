import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { Button, Alert } from '@mui/material'
import cx from 'classnames'
import { omit } from 'lodash'

import { uploadFiles } from '@ors/helpers'

import { useBPListApi } from '../BPList/BPList'
import { NavigationButton } from './NavigationButton'

import { BiTrash } from 'react-icons/bi'
import { FiFileText } from 'react-icons/fi'

interface IBPImport {
  file: FileList | null
  filters: any
  setCurrentStep: Dispatch<SetStateAction<number>>
  setFile: Dispatch<SetStateAction<FileList | null>>
  setValidations: Dispatch<SetStateAction<any>>
}

const BPImport = ({
  file,
  filters,
  setCurrentStep,
  setFile,
  setValidations,
}: IBPImport) => {
  const { results } = useBPListApi(omit(filters, 'meeting', 'decision'))
  const { bp_status, decision, meeting, year_end, year_start } = filters

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files)
    }
  }

  const validateBP = async () => {
    try {
      const baseUrl = `api/business-plan/upload/validate/?year_start=${year_start}&year_end=${year_end}&status=${bp_status}&meeting_number=${meeting}`

      const formattedUrl = decision
        ? baseUrl + `&decision_number=${decision}`
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
    <>
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
                download={file[0].name}
                href={URL.createObjectURL(file[0])}
              >
                <p className="mb-0 mt-0.5 text-xl text-primary">
                  {file[0].name}
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
      {file && results.length > 0 && (
        <Alert className="BPAlert mt-2 w-fit border-0" severity="warning">
          <p className="m-0 text-lg">
            You are about to overwrite the existing data from this Business
            Plan. Old versions are not kept in the system. Would you like to
            continue?
          </p>
        </Alert>
      )}
      <div className="flex items-center gap-2.5">
        <Button
          className={cx('mt-5 h-10 px-3 py-1', {
            'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
              file,
          })}
          disabled={!file}
          size="large"
          variant="contained"
          onClick={validateBP}
        >
          Upload
        </Button>
        <NavigationButton {...{ setCurrentStep }} direction={'back'} />
      </div>
    </>
  )
}

export default BPImport
