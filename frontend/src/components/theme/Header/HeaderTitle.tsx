'use client'
import { useEffect, useState } from 'react'

import { Divider } from '@mui/material'
import cx from 'classnames'

import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
import useStore from '@ors/store'

export type TitleProps = {
  children: React.ReactNode
  visible: boolean
}

export type HeaderTitleProps = {
  children: React.ReactNode
}

function Title({ children, visible }: TitleProps) {
  return (
    <CollapseInOut>
      <Divider
        className={cx('-ml-4 mb-12 mt-4 w-[calc(100%+2rem)] border-gray-200', {
          'pointer-events-none absolute left-0 top-0 opacity-0': !visible,
        })}
      />
      {children}
      <div className="mb-4" />
    </CollapseInOut>
  )
}

export default function HeaderTitle({ children }: HeaderTitleProps) {
  const [mounted, setMounted] = useState(false)
  const { setHeaderTitleComponent } = useStore((state) => state.header)

  useEffect(() => {
    setMounted(true)
    setHeaderTitleComponent(<Title visible={true}>{children}</Title>)

    return () => {
      setHeaderTitleComponent(null)
    }

    /* eslint-disable-next-line */
  }, [])

  return !mounted && <Title visible={false}>{children}</Title>
}
