'use client'
import React, { useContext, useState } from 'react'

import { useParams } from 'next/navigation'

import BusinessPlansTable from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

import { useGetFiles } from '../BPEdit/useGetFiles'
import BPHeaderView from '../BPHeaderView'
import BPTabs from '../BPTabs'

function BPView() {
  // TODO: Switch from BPContext to useApi()

  const pathParams = useParams<{ agency: string; period: string }>()
  const { data: bpFiles } = useGetFiles(pathParams) as any

  const { loading } = useContext(BPContext) as any
  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderView />
      <BPTabs {...{ activeTab, bpFiles, setActiveTab }}>
        <BusinessPlansTable />
      </BPTabs>
    </>
  )
}

export default function BPViewWrapper() {
  return (
    <BPYearRangesProvider>
      <BPProvider>
        <BPView />
      </BPProvider>
    </BPYearRangesProvider>
  )
}
