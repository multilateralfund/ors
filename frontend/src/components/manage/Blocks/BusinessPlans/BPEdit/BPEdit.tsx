'use client'

import { ApiBPActivity } from '@ors/types/api_bp_get'

import React, { useContext, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { getResults } from '@ors/helpers'

import BPTabs from '../BPTabs'
import { BPEditDataInterface } from '../types'
import BEditTable from './BPEditTable'
import BPHeaderEdit from './BPHeaderEdit'

const BPEditComponents = (props: BPEditDataInterface) => {
  const { params, results } = props
  const [form, setForm] = useState<Array<ApiBPActivity>>(results)
  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <BPHeaderEdit />
      <BPTabs {...{ activeTab, setActiveTab }}>
        <BEditTable {...{ form, params, setForm }} {...props} />
      </BPTabs>
    </>
  )
}

const BPEdit = () => {
  const { data, loading, params } = useContext(BPContext) as any

  const activities = data?.results?.activities
  const { loaded, results } = getResults(activities)

  const dataReady = loaded && results

  if (!dataReady) {
    return (
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
    )
  }

  return <BPEditComponents {...{ loaded, loading, params, results }} />
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
