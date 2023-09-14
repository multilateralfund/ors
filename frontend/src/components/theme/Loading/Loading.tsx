import { CSSProperties } from 'react'

import { CircularProgress } from '@mui/material'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function Loading({
  ProgressStyle,
  active = true,
  className,
  style,
}: {
  ProgressStyle?: CSSProperties | undefined
  active?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    !!active && (
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
  )
}
