import { Dispatch, SetStateAction, useState } from 'react'

import { Box, Button } from '@mui/material'
import cx from 'classnames'

import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'

const BPUploadFilters = ({
  currentStep,
  periodOptions,
  setCurrentStep,
  step,
}: {
  currentStep: number
  periodOptions: any
  setCurrentStep: Dispatch<SetStateAction<number>>
  step: number
}) => {
  const isCurrentStep = currentStep === step

  const moveToNextStep = () => {
    if (isCurrentStep) {
      setCurrentStep(step + 1)
    }
  }

  const [downloadYearsRange, setDownloadYearsRange] = useState()

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
          Step {step}
        </p>
        <p
          className={cx('m-0 text-2xl', {
            'text-gray-500': !isCurrentStep,
          })}
        >
          Would you like to download the business plan from
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        {/* <Link
          className={cx('h-10 border border-solid border-primary px-3 py-1', {
            'bg-white text-primary': !isCurrentStep,
          })}
          disabled={!isCurrentStep}
          // @ts-ignore
          prefetch={false}
          size="large"
          target="_blank"
          variant="contained"
          href={formatApiUrl(
            `/api/business-plan-activity/export/?year_start=${splitPeriod[0]}&year_end=${splitPeriod[1]}&agency_id=${currentAgency?.id}`,
          )}
          onClick={moveToNextStep}
          button
          download
        >
          Download
        </Link> */}
        {isCurrentStep && (
          <Button
            className="h-10 border border-solid border-primary bg-white px-3 py-1 text-primary"
            size="large"
            variant="contained"
            onClick={moveToNextStep}
          >
            Next
          </Button>
        )}
      </div>
    </Box>
  )
}

export default BPUploadFilters
