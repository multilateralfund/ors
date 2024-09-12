import { ChangeEvent, useState } from 'react'

import { Box, Button, Divider } from '@mui/material'
import cx from 'classnames'

import { SubmitButton } from '@ors/components/ui/Button/Button'

import ColumnsFilter from './ColumnsFilter'

import { BiTrash } from 'react-icons/bi'
import { FiFileText } from 'react-icons/fi'

const BPImportActivities = ({
  isCurrentStep,
  setCurrentStep,
}: {
  isCurrentStep: boolean
  setCurrentStep: any
}) => {
  const [file, setFile] = useState<FileList | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files)
    }
  }
  const possibleColumns = [
    { id: 'country', name: 'Country' },
    { id: 'agency', name: 'Agency' },
    { id: 'hcfc_status', name: 'HCFC Status' },
    { id: 'type', name: 'Type' },
    { id: 'legacy_type', name: 'Legacy Type' },
    { id: 'chemical', name: 'Chemical' },
    { id: 'hcfc_chemical_detail', name: 'HCFC Chemical Detail' },
    { id: 'polyol_amount', name: 'Amount of Polyol in Project (MT)' },
    { id: 'cluster', name: 'Cluster' },
    { id: 'sector', name: 'Sector' },
    { id: 'subsector', name: 'Subsector' },
    { id: 'legacy_sector_and_subsector', name: 'Legacy Sector and Subsector' },
    { id: 'title', name: 'Title' },
  ]

  return (
    <Box
      className={cx('flex flex-col gap-6 p-6 shadow-none', {
        'border-black': isCurrentStep,
      })}
    >
      <div>
        <p
          className={cx('m-0 text-base uppercase text-gray-500', {
            'text-secondary': isCurrentStep,
          })}
        >
          Step 2
        </p>
        <p
          className={cx('m-0 text-2xl', {
            'text-gray-500': !isCurrentStep,
          })}
        >
          Upload new file:
        </p>
        <p
          className={cx('mb-0 mt-3 text-lg', {
            'text-gray-500': !isCurrentStep,
          })}
        >
          Only modify compatible files that have been downloaded from the
          platform.
        </p>
      </div>
      {!file && isCurrentStep ? (
        <Button
          className="h-10 w-fit border border-solid border-primary px-3 py-1 hover:text-white"
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
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {isCurrentStep && (
              <SubmitButton
                className="h-10 !text-[15px]"
                onClick={() => {
                  setCurrentStep(3)
                }}
              >
                Upload
              </SubmitButton>
            )}
            <div className="flex items-start gap-2.5 font-medium">
              <FiFileText
                className="min-h-5 min-w-5 text-secondary"
                size={20}
              />
              <p className="mb-0 mt-0.5 text-base">{file?.[0].name}</p>
              {isCurrentStep && (
                <BiTrash
                  className="min-h-5 min-w-5 cursor-pointer text-gray-700"
                  size={20}
                  onClick={() => setFile(null)}
                />
              )}
            </div>
          </div>
          <Divider className="mt-6 w-full" />
          <div className="mt-5 flex flex-wrap gap-6">
            <p className="m-0 max-w-32 text-lg">
              Update only the following columns
            </p>
            <ColumnsFilter {...{ isCurrentStep, possibleColumns }} />
          </div>
        </div>
      )}
    </Box>
  )
}

export default BPImportActivities
