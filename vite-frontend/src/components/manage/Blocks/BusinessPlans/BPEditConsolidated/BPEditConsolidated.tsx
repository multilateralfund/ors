'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import React, { useCallback, useEffect, useState } from 'react'

import { find, map } from 'lodash'
import { useParams } from 'wouter'

import Loading from '@ors/components/theme/Loading/Loading'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import { useStore } from '@ors/store'

import BEditTable from '../BPEdit/BPEditTable'
import BPRestoreEdit from '../BPEdit/BPRestoreEdit'
import { useGetActivities } from '../useGetActivities'
import BPHeaderEditConsolidated from './BPHeaderEditConsolidated'
import { useEditLocalStorageConsolidated } from './useLocalStorageConsolidated'

const BPEdit = () => {
  const { period, type } = useParams<{ period: string; type: string }>()
  const [year_start, year_end] = period.split('-')

  const initialFilters = {
    version_type: type,
    year_end: year_end,
    year_start: year_start,
  }

  const {
    loading,
    params,
    results: activities,
  } = useGetActivities(initialFilters)

  const bpSlice = useStore((state) => state.businessPlans)
  const commentTypes = bpSlice.commentTypes.data
  const agencies = useStore((state) => state?.common.agencies.data)

  const [form, setForm] = useState<Array<ApiEditBPActivity> | null>()
  const [warnOnClose, setWarnOnClose] = useState(false)
  useVisibilityChange(warnOnClose)

  const localStorage = useEditLocalStorageConsolidated(activities, type, period)

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
      agency_id: find(agencies, (agency) => agency.name === activity.agency)
        ?.id,
      comment_types: map(
        activity.comment_types,
        (comment_type) =>
          find(commentTypes, (comm_type) => comm_type.name === comment_type)
            ?.id,
      ),
      row_id: index,
    }))
  }, [commentTypes, activities, agencies])

  useEffect(() => {
    const formattedActivities = getFormattedActivities()

    if (formattedActivities && formattedActivities.length > 0) {
      handleSetForm(formattedActivities, false)
    }
  }, [getFormattedActivities, handleSetForm])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderEditConsolidated {...{ form, setWarnOnClose, type }} />
      <BPRestoreEdit localStorage={localStorage} setForm={handleSetForm}>
        Unsaved {type} data exists for {year_start}-{year_end}, would you like
        to recover it?
      </BPRestoreEdit>
      {form && !loading && (
        <>
          <div className="mb-1 flex justify-end">
            <div
              id="bp-consolidated-table-export-button"
              className="mb-1.5 self-end"
            />
          </div>
          <div className="relative rounded-lg border border-solid border-primary p-6">
            <BEditTable
              {...{ form, loading, params }}
              isConsolidatedView={true}
              setForm={handleSetForm}
            />
          </div>
        </>
      )}
    </>
  )
}

export default function BPEditConsolidated() {
  return (
    <BPYearRangesProvider>
      <BPEdit />
    </BPYearRangesProvider>
  )
}
