import cx from 'classnames'
import { CSSProperties } from 'react'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function Loading({
  className,
  ProgressStyle,
}: {
  className?: string
  ProgressStyle?: CSSProperties | undefined
}) {
  return (
    <Box
      className={cx(
        'absolute left-0 top-0 flex h-full w-full items-center justify-center bg-transparent dark:bg-transparent',
        className,
      )}
    >
      <CircularProgress style={ProgressStyle} />
    </Box>
  )
}
