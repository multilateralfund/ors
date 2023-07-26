import { CSSProperties } from 'react'

import { Box, CircularProgress } from '@mui/material'
import cx from 'classnames'

export default function Loading({
  ProgressStyle,
  className,
  style
}: {
  ProgressStyle?: CSSProperties | undefined
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Box
      className={cx(
        'absolute left-0 top-0 flex h-full w-full items-center justify-center bg-transparent dark:bg-transparent',
        className,
      )}
      style={style}
    >
      <CircularProgress style={ProgressStyle} />
    </Box>
  )
}
