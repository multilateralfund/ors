'use client'
import { CSSProperties, useEffect, useState } from 'react'

import {
  CircularProgress as MuiCircularProgress,
  Typography,
} from '@mui/material'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function LoadingBuffer({
  CircularProgress,
  className,
  style,
  text,
  time,
}: {
  CircularProgress?: {
    className?: string
    style?: CSSProperties
  }
  className?: string
  style?: React.CSSProperties
  text?: React.ReactNode
  time?: number
}) {
  const [progress, setProgress] = useState(10)

  useEffect(() => {
    const timer = setInterval(
      () => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer)
          }
          return prevProgress >= 100 ? 100 : prevProgress + 10
        })
      },
      (time || 500) / 10,
    )
    return () => {
      clearInterval(timer)
    }
  }, [time])

  return (
    <FadeInOut
      transition={{ duration: 0.3 }}
      className={cx(
        'loading loading-buffer absolute left-0 top-0 z-absolute flex h-full w-full flex-col items-center justify-center',
        className,
      )}
      style={style}
    >
      {!!text && (
        <Typography className="mb-4" color="text.secondary">
          {text}
        </Typography>
      )}

      <div className="circular-progress-wrapper relative">
        <MuiCircularProgress
          className={cx('z-10 block', CircularProgress?.className)}
          style={CircularProgress?.style}
          value={progress}
          variant="determinate"
        />
        <Typography
          className="progress absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center"
          color="text.secondary"
          variant="caption"
        >
          <span>{`${Math.round(progress)}%`}</span>
        </Typography>
      </div>
    </FadeInOut>
  )
}
