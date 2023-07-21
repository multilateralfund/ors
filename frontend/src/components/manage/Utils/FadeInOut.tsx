'use client'
import { ReactHTML } from 'react'

import { HTMLMotionProps, motion } from 'framer-motion'
import { get } from 'lodash'

import { AnyObject } from '@ors/@types/primitives'

function FadeInOut({
  FadeInOut,
  children,
  ...rest
}: HTMLMotionProps<keyof ReactHTML> & {
  FadeInOut?: AnyObject & { component: string }
}) {
  const Motion = get(motion, FadeInOut?.component || 'div')

  return (
    <Motion
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      {...rest}
    >
      {children}
    </Motion>
  )
}

export default FadeInOut
