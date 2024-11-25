import React, { CSSProperties } from 'react'

import { CircularProgress, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function Loading({
  ProgressStyle,
  active = true,
  className,
  style,
  text,
}: {
  ProgressStyle?: CSSProperties | undefined
  active?: boolean
  className?: string
  style?: React.CSSProperties
  text?: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {!!active && (
        <FadeInOut
          transition={{ duration: 0.3 }}
          className={cx(
            'loading absolute left-0 top-0 z-absolute flex h-full w-full flex-col items-center justify-center',
            className,
          )}
          style={style}
        >
          {!!text && (
            <Typography className="mb-4" color="text.secondary">
              {text}
            </Typography>
          )}
          <CircularProgress style={ProgressStyle} disableShrink />
        </FadeInOut>
      )}
    </AnimatePresence>
  )
}
