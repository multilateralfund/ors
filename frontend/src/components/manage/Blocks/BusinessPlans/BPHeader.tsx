'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@mui/material'
import cx from 'classnames'
import { capitalize } from 'lodash'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Link from '@ors/components/ui/Link/Link'
import useGetBpData from '@ors/hooks/useGetBpData'
import { useStore } from '@ors/store'

const ViewHeaderActions = () => {
  const { data, loading, setParams } = useGetBpData()
  console.log('header data', data)
  if (!data && loading) return null
  return <div className="flex items-center">caca</div>
}

type HeaderTagProps = {
  children: React.ReactNode
  status: any
}

const HeaderTag = ({ children, status }: HeaderTagProps) => {
  return (
    <span
      className={cx(
        'self-baseline rounded p-1 font-medium uppercase leading-none',
        {
          'bg-mlfs-hlYellow': status === 'final',
          'bg-warning': status === 'draft',
        },
      )}
    >
      {children}
    </span>
  )
}

const ViewHeaderTag = () => {
  const { data, loading, setParams } = useGetBpData()

  const label = useMemo(() => {
    switch (status) {
      case 'final':
        return 'Latest'
      case 'draft':
        return 'Draft'
      default:
        return ''
    }
  }, [status])

  return <HeaderTag status={status}>{capitalize(label)}</HeaderTag>
}

const BPHeader = ({
  actions = <ViewHeaderActions />,
  tag = <ViewHeaderTag />,
  titlePrefix,
}: {
  actions?: React.JSX.Element
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
}) => {
  const { data, loading } = useGetBpData()
  const [memo, setMemo] = useState(0)

  useEffect(() => {
    setMemo((prev) => prev + 1)
  }, [data])

  return (
    !!data && (
      <HeaderTitle memo={memo}>
        <div className="mb-2 font-[500] uppercase">
          Country programme report
        </div>
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <div className="flex items-center gap-x-2">
              {/*{titlePrefix}*/}
              {/*{tag}*/}
            </div>
          </div>
          <div className="ml-auto">{actions}</div>
        </div>
      </HeaderTitle>
    )
  )
}

const BPHeaderView = () => {
  return <BPHeader />
}

export { BPHeaderView }
