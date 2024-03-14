import { Button, ButtonProps } from '@mui/material'
import cx from 'classnames'
import { isUndefined } from 'lodash'

export default function IconButton({
  active,
  className,
  ...rest
}: ButtonProps & { active?: boolean }) {
  const isActive = isUndefined(active) || !!active

  return (
    <Button
      className={cx(
        'min-w-fit rounded-lg border border-solid border-primary p-[6px] hover:border-typography',
        {
          'bg-action-highlight text-typography-primary': isActive,
          'bg-action-highlight/10 text-typography-faded theme-dark:bg-action-highlight/20':
            !isActive,
        },
        className,
      )}
      {...rest}
    />
  )
}
