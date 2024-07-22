'use client'

import { useEffect, useState } from 'react'

import cx from 'classnames'

import Portal from '@ors/components/manage/Utils/Portal'

function Title({ children, visible }) {
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

export default function HeaderTitle({ children }) {
  const [domNode, setDomNode] = useState(null)

  useEffect(function () {
    const elTarget = document.getElementById('header-title')
    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={domNode} domNode={domNode}>
      <Title visible={true}>{children}</Title>
    </Portal>
  )
}
