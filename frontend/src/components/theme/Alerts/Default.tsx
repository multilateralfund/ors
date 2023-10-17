import { forwardRef, useCallback, useMemo } from 'react'

import { IconButton, SnackbarContent } from '@mui/material'
import cx from 'classnames'
import { CustomContentProps, useSnackbar } from 'notistack'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

const DefaultAlert = forwardRef<HTMLDivElement, CustomContentProps>(
  function DefaultAlert({ id, ...props }, ref) {
    const { iconVariant, variant } = props
    const { closeSnackbar } = useSnackbar()

    const handleDismiss = useCallback(() => {
      closeSnackbar(id)
    }, [id, closeSnackbar])

    const Icon = useMemo(() => {
      return () => iconVariant[variant] || null
    }, [iconVariant, variant])

    return (
      <SnackbarContent
        className={cx({
          'bg-error': variant === 'error',
          'bg-info': variant === 'info',
          'bg-primary': variant === 'default',
          'bg-success': variant === 'success',
          'bg-warning': variant === 'warning',
        })}
        ref={ref}
        variant="elevation"
        action={
          !props.persist && (
            <IconButton className="text-white" onClick={handleDismiss}>
              <IoClose />
            </IconButton>
          )
        }
        message={
          <div className="flex items-center">
            <Icon />
            {props.message}
          </div>
        }
      />
    )
  },
)

export default DefaultAlert
