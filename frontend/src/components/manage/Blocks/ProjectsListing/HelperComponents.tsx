import { Button } from '@mui/material'
import cx from 'classnames'

type ButtonProps = {
  title: string
  onSubmit: () => void
  isDisabled?: boolean
  className?: string
}

export const SubmitButton = ({
  title,
  onSubmit,
  isDisabled = false,
  className,
}: ButtonProps) => (
  <Button
    className={cx(className, 'mr-0 h-10 px-3 py-1', {
      'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
        !isDisabled,
    })}
    size="large"
    variant="contained"
    onClick={onSubmit}
    disabled={isDisabled}
  >
    {title}
  </Button>
)

export const IncreaseVersionButton = ({
  title,
  onSubmit,
  isDisabled = false,
}: ButtonProps) => (
  <Button
    className={cx('px-4 py-2', {
      'bg-primary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
        !isDisabled,
    })}
    size="large"
    variant="contained"
    onClick={onSubmit}
    disabled={isDisabled}
  >
    {title}
  </Button>
)
