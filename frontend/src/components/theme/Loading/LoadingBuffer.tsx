'use client'
import { CSSProperties, useCallback, useEffect } from 'react'

import {
  CircularProgress as MuiCircularProgress,
  Typography,
} from '@mui/material'
import cx from 'classnames'

import FadeInOut, {
  FadeInOutProps,
} from '@ors/components/manage/Transitions/FadeInOut'
import useStateWithPrev from '@ors/hooks/useStateWithPrev'

let timer: any

type LoadingBufferProps = {
  CircularProgress?: {
    className?: string
    style?: CSSProperties
  }
  FadeInOutProps?: FadeInOutProps
  active?: boolean
  className?: string
  style?: React.CSSProperties
  text?: React.ReactNode
  time?: number
}

export default function LoadingBuffer(props: LoadingBufferProps) {
  const {
    CircularProgress,
    FadeInOutProps = {},
    active = true,
    className,
    style,
    text,
    time,
  } = props
  const [progress, setProgress, prevProgress] = useStateWithPrev<any>(0)

  const updateProgress = useCallback(() => {
    setProgress((prevProgress: any) => {
      return prevProgress >= 100 ? 100 : prevProgress + 10
    })
  }, [setProgress])

  useEffect(() => {
    if (prevProgress.current === 100 && timer) {
      clearInterval(timer)
      return
    }
    timer = setInterval(
      () => {
        requestAnimationFrame(updateProgress)
      },
      (time || 500) / 10,
    )
    return () => {
      clearInterval(timer)
    }
    /* eslint-disable-next-line */
  }, [time])

  return (
    !!active && (
      <FadeInOut
        transition={{ duration: 0.3 }}
        className={cx(
          'loading loading-buffer absolute left-0 top-0 z-absolute flex h-full w-full flex-col items-center justify-center',
          className,
        )}
        style={style}
        {...FadeInOutProps}
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
  )
}
