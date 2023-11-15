'use client'
import { useEffect, useState } from 'react'

import { Divider } from '@mui/material'
import cx from 'classnames'

import useStore from '@ors/store'

export type TitleProps = {
  children: React.ReactNode
  visible: boolean
}

export type HeaderTitleProps = {
  animationDelay?: number
  children: React.ReactNode
  memo?: any
  onAnimationEnd?: () => any
}

function Title({ children, visible }: TitleProps) {
  return (
    <div>
      <Divider
        className={cx('mb-12 mt-4 w-full border-gray-200', {
          'pointer-events-none absolute left-0 top-0 hidden opacity-0':
            !visible,
        })}
      />
      {children}
      <div className="mb-4" />
    </div>
  )
}

export default function HeaderTitle({
  animationDelay = 600,
  children,
  memo = '',
  onAnimationEnd,
}: HeaderTitleProps) {
  const [mounted, setMounted] = useState(false)
  const { setHeaderTitleComponent } = useStore((state) => state.header)

  useEffect(() => {
    console.log('HERE REBUILD HEADER')
    setMounted(true)
    setHeaderTitleComponent(<Title visible={true}>{children}</Title>, false)

    if (onAnimationEnd) {
      setTimeout(() => {
        onAnimationEnd()
      }, animationDelay)
    }

    return () => {
      setHeaderTitleComponent(null, false)
    }

    /* eslint-disable-next-line */
  }, [memo])

  return null

  return !mounted && <Title visible={false}>{children}</Title>
}
