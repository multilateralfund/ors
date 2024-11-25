'use client'

import type { HTMLMotionProps } from 'framer-motion'

import { Ref, forwardRef } from 'react'

import cx from 'classnames'
import { LazyMotion, domAnimation, m } from 'framer-motion'

export type FadeInOutProps = HTMLMotionProps<'div'>

const FadeInOut = forwardRef(function FadeInOut(
  { children, className, ...rest }: FadeInOutProps,
  ref?: Ref<HTMLDivElement>,
) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cx('fade-in-out', className)}
        ref={ref}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
})

export default FadeInOut
