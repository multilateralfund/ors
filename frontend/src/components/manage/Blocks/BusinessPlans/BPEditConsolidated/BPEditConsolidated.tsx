'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useEffect, useState } from 'react'

import { capitalize, map } from 'lodash'
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
import { useBPListApi } from '../BPList/BPList'
import BPTabs from '../BPTabs'
import { BpFilesObject } from '../types'
import { useGetBpData } from '../BP/useGetBpData'

const BPEdit = () => {
  const { period, type } = useParams<{ period: string; type: string }>()
  const [year_start, year_end] = period.split('-')

  const initialFiltersActivities = {
    bp_status: capitalize(type),
    year_end: year_end,
    year_start: year_start,
  }

  const initialFiltersBps = {
    status: capitalize(type),
    year_end: year_end,
    year_start: year_start,
  }

  const {
    loading,
    params,
    results: activities,
  } = useGetActivities(initialFiltersActivities)
  const { results, loading: bpLoading } = useBPListApi(initialFiltersBps)
  const { data: bpFiles } = useGetBpData(
    initialFiltersBps,
    'api/business-plan/files/',
    'files',
  ) as any
  const { data } = useGetBpData(
    initialFiltersBps,
    'api/business-plan/get/',
    'fullData',
  ) as any

  const agencies = useStore((state) => state?.common.agencies.data)

  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState<Array<ApiEditBPActivity> | undefined>(
    undefined,
  )
  const [bpForm, setBpForm] = useState()
  const [files, setFiles] = useState<BpFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
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
      row_id: index,
    }))
  }, [activities, agencies])

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
      {!bpLoading && (
        <BPHeaderEditConsolidated
          {...{ form, setWarnOnClose, type, results, bpForm, files }}
        />
      )}
      {!loading && (
        <BPRestoreEdit localStorage={localStorage} setForm={handleSetForm}>
          Unsaved {type} data exists for {year_start}-{year_end}, would you like
          to recover it?
        </BPRestoreEdit>
      )}
      <BPTabs
        {...{
          activeTab,
          setActiveTab,
          setBpForm,
          setFiles,
          files,
          bpFiles,
          results,
          data,
        }}
        isConsolidatedBp
      >
        {!loading && results.length > 0 && (
          <BEditTable
            {...{ form, loading, params }}
            isConsolidatedView={true}
            setForm={handleSetForm}
          />
        )}
      </BPTabs>
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
