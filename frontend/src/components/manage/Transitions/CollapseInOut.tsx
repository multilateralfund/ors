'use client'
import type { HTMLMotionProps } from 'framer-motion'

import cx from 'classnames'
import { LazyMotion, domAnimation, m } from 'framer-motion'

export default function CollapseInOut({
  children,
  className,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ height: 0 }}
        exit={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ duration: 0.3 }}
        className={cx('motion collapse-in-out', className)}
        style={{ overflow: 'hidden' }}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
