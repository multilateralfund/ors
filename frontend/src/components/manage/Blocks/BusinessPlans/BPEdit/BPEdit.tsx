'use client'

import { ApiBPActivity } from '@ors/types/api_bp_get'

import React, { useState } from 'react'

import { useParams } from 'next/navigation'

import Loading from '@ors/components/theme/Loading/Loading'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

import BPTabs from '../BPTabs'
import { BPEditDataInterface } from '../types'
import BEditTable from './BPEditTable'
import BPHeaderEdit from './BPHeaderEdit'
import { useGetAllActivities } from './useGetAllActivities'

const BPEditComponents = (props: BPEditDataInterface) => {
  const { data, params } = props
  const { activities, business_plan } = data || {}

  const [form, setForm] = useState<Array<ApiBPActivity>>(activities)
  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <BPHeaderEdit business_plan={business_plan} form={form} />
      <BPTabs {...{ activeTab, setActiveTab }}>
        <BEditTable {...{ form, params, setForm }} {...props} />
      </BPTabs>
    </>
  )
}

const BPEdit = () => {
  const pathParams = useParams<{ agency: string; period: string }>()

  const { data, loading, params } = useGetAllActivities(pathParams) as any
  const { activities } = data || {}

  const dataReady = !loading && activities

  if (!dataReady) {
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
    )
  }

  return <BPEditComponents {...{ data, loading, params }} />
}

export default function BPEditWrapper() {
  return (
    <BPYearRangesProvider>
      <BPProvider>
        <BPEdit />
      </BPProvider>
    </BPYearRangesProvider>
  )
}
