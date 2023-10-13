'use client'

import type { AnyObject } from '@ors/types/primitives'
import type { HTMLMotionProps } from 'framer-motion'

import { ReactHTML } from 'react'

import cx from 'classnames'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { get } from 'lodash'

export type FadeInOutProps = HTMLMotionProps<keyof ReactHTML> & {
  [key: string]: any
  FadeInOut?: AnyObject & { component: string }
}

export default function FadeInOut({
  FadeInOut,
  children,
  className,
  ...rest
}: FadeInOutProps) {
  const Motion = get(m, FadeInOut?.component || 'div')

  return (
    <LazyMotion features={domAnimation} strict>
      <Motion
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cx('motion fade-in-out', className)}
        {...rest}
      >
        {children}
      </Motion>
    </LazyMotion>
  )
}
