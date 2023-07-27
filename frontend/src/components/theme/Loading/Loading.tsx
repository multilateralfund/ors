import { CSSProperties } from 'react'

import { CircularProgress } from '@mui/material'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'

export default function Loading({
  ProgressStyle,
  className,
  style,
}: {
  ProgressStyle?: CSSProperties | undefined
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <FadeInOut
      transition={{ duration: 0.3 }}
      className={cx(
        'loading absolute left-0 top-0 z-absolute flex h-full w-full items-center justify-center',
        className,
      )}
      style={style}
    >
      <CircularProgress style={ProgressStyle} />
    </FadeInOut>
  )
}
