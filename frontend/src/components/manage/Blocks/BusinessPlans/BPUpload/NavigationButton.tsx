import { Button } from '@mui/material'
import cx from 'classnames'

import { INavigationButton } from '../types'

export const NavigationButton = ({
  direction,
  isBtnDisabled = false,
  setCurrentStep,
}: INavigationButton) => {
  const moveToNextStep = () => {
    setCurrentStep((step) => (direction === 'next' ? step + 1 : step - 1))
  }

  return (
    <div className="mt-5">
      <Button
        className={cx('h-10 px-3 py-1', {
          'border border-solid border-primary bg-white text-primary ':
            !isBtnDisabled,
        })}
        disabled={isBtnDisabled}
        size="large"
        variant="contained"
        onClick={moveToNextStep}
      >
        {direction}
      </Button>
    </div>
  )
}
