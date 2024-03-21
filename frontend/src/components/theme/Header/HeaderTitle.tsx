'use client'
import { useEffect } from 'react'

import cx from 'classnames'

import { useStore } from '@ors/store'

export type TitleProps = {
  children: React.ReactNode
  visible: boolean
}

export type HeaderTitleProps = {
  children: React.ReactNode
  memo?: any
}

function Title({ children, visible }: TitleProps) {
  return (
    <div>
      <div
        className={cx('mb-12 mt-2 w-full border-gray-200', {
          'pointer-events-none absolute left-0 top-0 hidden opacity-0':
            !visible,
        })}
      />
      {children}
      <div className="mb-4" />
    </div>
  )
}

export default function HeaderTitle({ children, memo }: HeaderTitleProps) {
  const { setHeaderTitleComponent } = useStore((state) => state.header)

  useEffect(() => {
    setHeaderTitleComponent(<Title visible={true}>{children}</Title>, false)

    return () => {
      setHeaderTitleComponent(null, false)
    }

    /* eslint-disable-next-line */
  }, [memo])

  return null
}
