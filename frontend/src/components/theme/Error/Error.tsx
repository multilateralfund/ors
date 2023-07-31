import { Box, Typography } from '@mui/material'
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
        'error mx-auto flex h-full w-full max-w-md flex-col justify-center px-4',
        statusCode,
      )}
    >
      <Box className="p-8">
        <div className="flex items-center justify-center">
          {!!statusCode && (
            <Typography
              className="text-error theme-dark:text-red-400"
              component="h1"
              variant="h4"
            >
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
      </Box>
    </div>
  )
}
