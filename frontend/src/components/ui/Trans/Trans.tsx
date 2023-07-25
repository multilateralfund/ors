'use client'

import type { AnyObject } from '@ors/types/primitives'

import useStore from '@ors/store'

import CSRTrans from './CSRTrans'
import SSRTrans from './SSRTrans'

export default function Trans({
  id,
  children,
  ns,
  options,
}: {
  children?: React.ReactNode
  id?: string
  ns?: string
  options?: AnyObject
}) {
  const lang = useStore((state) => state.i18n.lang)

  if (__SERVER__) {
    return (
      <SSRTrans id={id} lang={lang} ns={ns} options={options}>
        {children}
      </SSRTrans>
    )
  }
  return (
    <CSRTrans id={id} ns={ns} options={options}>
      {children}
    </CSRTrans>
  )
}
