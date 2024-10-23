'use client'

import { ApiBPActivity } from '@ors/types/api_bp_get'

import React, { useCallback, useEffect, useState } from 'react'

import { find, map } from 'lodash'
import { useParams } from 'next/navigation'

import Loading from '@ors/components/theme/Loading/Loading'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { useStore } from '@ors/store'

import BPTabs from '../BPTabs'
import BEditTable from './BPEditTable'
import BPHeaderEdit from './BPHeaderEdit'
import { useGetAllActivities } from './useGetAllActivities'

const BPEdit = () => {
  const pathParams = useParams<{ agency: string; period: string }>()

  const { data, loading, params } = useGetAllActivities(pathParams) as any
  const { activities, business_plan } = data || {}

  const bpSlice = useStore((state) => state.businessPlans)
  const commentTypes = bpSlice.commentTypes.data

  const dataReady = !loading && activities

  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState<Array<ApiBPActivity> | null>()

  const getFormattedActivities = useCallback(() => {
    if (!activities) {
      return null
    }

    return map(activities, (activity) => ({
      ...activity,
      comment_types: map(
        activity.comment_types,
        (comment_type) =>
          find(commentTypes, (comm_type) => comm_type.name === comment_type)
            ?.id,
      ),
    }))
  }, [commentTypes, activities])

  useEffect(() => {
    setForm(getFormattedActivities())
  }, [getFormattedActivities])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderEdit business_plan={business_plan} form={form} />
      <BPTabs {...{ activeTab, setActiveTab }}>
        {form && <BEditTable {...{ form, loading, params, setForm }} />}
      </BPTabs>
    </>
  )
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
