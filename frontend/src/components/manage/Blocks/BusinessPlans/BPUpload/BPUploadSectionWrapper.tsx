import { Box } from '@mui/material'
import cx from 'classnames'

interface IBPUploadSectionWrapper {
  children: any
  isCurrentStep: boolean
  step: number
}

const BPUploadSectionWrapper = ({
  children,
  isCurrentStep,
  step,
}: IBPUploadSectionWrapper) => {
  return (
    <Box
      className={cx('p-7 shadow-none', {
        'border-black': isCurrentStep,
      })}
    >
      <p
        className={cx('m-0 text-base uppercase text-gray-500', {
          'text-secondary': isCurrentStep,
        })}
      >
        Step {step}
      </p>
      <div
        className={cx('mt-4 flex flex-col gap-y-3', {
          'pointer-events-none opacity-50': !isCurrentStep,
        })}
      >
        {children}
      </div>
    </Box>
  )
}

export default BPUploadSectionWrapper
