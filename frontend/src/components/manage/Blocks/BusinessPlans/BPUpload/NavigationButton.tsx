import { Button } from '@mui/material'
import cx from 'classnames'

import { INavigationButton } from '../types'

export const NavigationButton = ({
  direction,
  isBtnDisabled = false,
  setCurrentStep,
  setCurrentTab,
  title,
  classname,
}: INavigationButton) => {
  const moveToNextStep = () => {
    setCurrentStep((step) => (direction === 'next' ? step + 1 : step - 1))

    if (setCurrentTab) {
      setCurrentTab((tab) => (direction === 'next' ? tab + 1 : tab - 1))
    }
  }

  return (
    <div className="mt-5">
      <Button
        className={cx(
          'h-10 px-3 py-1',
          {
            'border border-solid border-primary bg-white text-primary':
              !isBtnDisabled,
          },
          classname,
        )}
        disabled={isBtnDisabled}
        size="large"
        variant="contained"
        onClick={moveToNextStep}
      >
        {title || direction}
      </Button>
    </div>
  )
}
