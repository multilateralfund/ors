'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import React, { useCallback, useEffect, useState } from 'react'

import { find, map } from 'lodash'
import { useParams } from 'next/navigation'

import Loading from '@ors/components/theme/Loading/Loading'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import { useStore } from '@ors/store'

import BPTabs from '../BPTabs'
import { useEditLocalStorage } from '../useLocalStorage'
import BEditTable from './BPEditTable'
import BPHeaderEdit from './BPHeaderEdit'
import BPRestoreEdit from './BPRestoreEdit'
import { useGetAllActivities } from './useGetAllActivities'

const BPEdit = () => {
  const pathParams = useParams<{ agency: string; period: string }>()

  const { data, loading, params } = useGetAllActivities(pathParams) as any
  const { activities, business_plan: business_plann } = data || {}
  const { businessPlan } = useStore((state) => state.businessPlan)

  const business_plan = businessPlan?.id ? businessPlan : business_plann || {}

  const bpSlice = useStore((state) => state.businessPlans)
  const commentTypes = bpSlice.commentTypes.data

  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState<Array<ApiEditBPActivity> | null>()

  const [files, setFiles] = useState<File | null | undefined>(null)

  const [warnOnClose, setWarnOnClose] = useState(false)
  useVisibilityChange(warnOnClose)

  const localStorage = useEditLocalStorage(data)

  const handleSetForm = useCallback(
    (value: any, updateLocalStorage: boolean = true) => {
      if (!!updateLocalStorage) {
        localStorage.update(value)
      }
      if (localStorage.load()) {
        setWarnOnClose(true)
      }

      setForm(value)
    },
    [localStorage],
  )

  const getFormattedActivities = useCallback(() => {
    if (!activities) {
      return null
    }

    return map(activities, (activity, index) => ({
      ...activity,
      comment_types: map(
        activity.comment_types,
        (comment_type) =>
          find(commentTypes, (comm_type) => comm_type.name === comment_type)
            ?.id,
      ),
      row_id: index,
    }))
  }, [commentTypes, activities])

  useEffect(() => {
    const formattedActivities = getFormattedActivities()
    if (formattedActivities) {
      handleSetForm(formattedActivities, false)
    }
  }, [getFormattedActivities, handleSetForm])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderEdit business_plan={business_plan} files={files} form={form} />
      <BPRestoreEdit
        key={business_plan?.id}
        localStorage={localStorage}
        setForm={handleSetForm}
      />
      <BPTabs
        key={business_plan?.id}
        {...{ activeTab, business_plan, files, setActiveTab, setFiles }}
        isEdit={true}
      >
        {form && (
          <BEditTable {...{ form, loading, params }} setForm={handleSetForm} />
        )}
      </BPTabs>
    </>
  )
}

export default function BPEditWrapper() {
  const { businessPlan } = useStore((state) => state.businessPlan)

  return (
    <BPYearRangesProvider>
      <BPProvider>
        <BPEdit key={businessPlan.id} />
      </BPProvider>
    </BPYearRangesProvider>
  )
}
