'use client'

import { PropsWithChildren, useEffect, useState } from 'react'

import cx from 'classnames'

import Portal from '@ors/components/manage/Utils/Portal'

interface TitleProps extends PropsWithChildren {
  visible?: boolean
}

function Title({ children, visible }: TitleProps ) {
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

export default function HeaderTitle({ children }: PropsWithChildren) {
  const [domNode, setDomNode] = useState<Element | null>(null)

  useEffect(function () {
    const elTarget = document.getElementById('header-title')
    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={!!domNode} domNode={domNode!}>
      <Title visible={true}>{children}</Title>
    </Portal>
  )
}
