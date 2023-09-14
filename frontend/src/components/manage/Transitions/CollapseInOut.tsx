'use client'
import type { AnyObject } from '@ors/types/primitives'
import type { HTMLMotionProps } from 'framer-motion'

import { ReactHTML } from 'react'

import cx from 'classnames'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { get } from 'lodash'

export default function CollapseInOut({
  CollapseInOut,
  children,
  className,
  ...rest
}: HTMLMotionProps<keyof ReactHTML> & {
  [key: string]: any
  CollapseInOut?: AnyObject & { component: string }
}) {
  const Motion = get(m, CollapseInOut?.component || 'div')

  return (
    <LazyMotion features={domAnimation} strict>
      <Motion
        initial={{ height: 0 }}
        exit={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.3 }}
        className={cx('motion collapse-in-out', className)}
        style={{ overflow: 'hidden' }}
        {...rest}
      >
        {children}
      </Motion>
    </LazyMotion>
  )
}
