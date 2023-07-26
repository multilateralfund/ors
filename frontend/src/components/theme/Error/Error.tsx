import { Typography } from '@mui/material'
import cx from 'classnames'

export default function Error({
  children,
  message,
  statusCode,
}: {
  children?: React.ReactNode
  message?: number | string
  statusCode?: number | string
}) {
  return (
    <div
      className={cx(
        'error mx-auto flex h-full w-full max-w-sm flex-col justify-center',
        statusCode,
      )}
    >
      <div className="flex items-center justify-center">
        {!!statusCode && (
          <Typography component="h1" variant="h4">
            {statusCode}
          </Typography>
        )}
        {!!statusCode && !!message && (
          <span className="mx-4 h-4 border-r border-solid border-r-secondary" />
        )}
        {!!message && (
          <Typography component="h2" fontWeight="normal" variant="h6">
            {message}
          </Typography>
        )}
      </div>
      {children}
    </div>
  )
}
