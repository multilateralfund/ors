'use client'
import React, { useContext, useState } from 'react'

import cx from 'classnames'
import { capitalize } from 'lodash'
import { useParams } from 'wouter'

import BusinessPlansTable from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import Loading from '@ors/components/theme/Loading/Loading'
import { Status, statusStyles } from '@ors/components/ui/StatusPill/StatusPill'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

import { useGetFiles } from '../BPEdit/useGetFiles'
import BPHeaderView from '../BPHeaderView'
import BPTabs from '../BPTabs'
import { BpPathParams } from '../types'

function BPView() {
  // TODO: Switch from BPContext to useApi()

  const pathParams = useParams<BpPathParams>()
  const { status } = pathParams

  const { data: bpFiles } = useGetFiles(pathParams) as any
  const { loading } = useContext(BPContext) as any

  const [activeTab, setActiveTab] = useState(0)

  const {
    bgColor,
    border = '',
    textColor,
  } = statusStyles[capitalize(status) as Status] || {}

  const Tag = (
    <span
      className={cx(
        'self-baseline rounded border border-solid px-1.5 py-1 font-medium uppercase leading-none',
        bgColor,
        border,
        textColor,
      )}
    >
      {status}
    </span>
  )

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderView tag={Tag} />
      <BPTabs {...{ activeTab, bpFiles, setActiveTab }}>
        <BusinessPlansTable />
      </BPTabs>
    </>
  )
}

export default function BPViewWrapper() {
  const pathParams = useParams<{ status: string }>()
  const { status } = pathParams

  return (
    <BPYearRangesProvider>
      <BPProvider status={status}>
        <BPView />
      </BPProvider>
    </BPYearRangesProvider>
  )
}
