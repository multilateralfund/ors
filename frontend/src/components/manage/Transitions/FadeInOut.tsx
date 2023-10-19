'use client'

import type { HTMLMotionProps } from 'framer-motion'

import cx from 'classnames'
import { LazyMotion, domAnimation, m } from 'framer-motion'

export type FadeInOutProps = HTMLMotionProps<'div'>

export default function FadeInOut({
  children,
  className,
  ...rest
}: FadeInOutProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cx('fade-in-out', className)}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
