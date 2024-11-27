import { Dispatch, SetStateAction } from 'react'

import { Box, Button } from '@mui/material'
import cx from 'classnames'

const BPUploadSectionWrapper = ({
  children,
  currentStep,
  filters,
  setCurrentStep,
  step,
}: {
  children: any
  currentStep: number
  filters: any
  setCurrentStep: Dispatch<SetStateAction<number>>
  step: number
}) => {
  const isCurrentStep = currentStep === step
  const isNextEnabled =
    filters.year_start && filters.status && filters.meeting && filters.decision

  const moveToNextStep = () => {
    if (isCurrentStep) {
      setCurrentStep(step + 1)
    }
  }

  return (
    <Box
      className={cx('flex flex-col gap-6 p-7 shadow-none', {
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
        {/* <p
          className={cx('m-0 text-2xl', {
            'text-gray-500': !isCurrentStep,
          })}
        >
        </p> */}
        {children}
      </div>
      <div className="flex items-center gap-2.5">
        {isCurrentStep && (
          <Button
            className={cx('h-10 px-3 py-1', {
              'border border-solid border-primary bg-white text-primary ':
                isNextEnabled,
            })}
            disabled={!isNextEnabled}
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

export default BPUploadSectionWrapper
