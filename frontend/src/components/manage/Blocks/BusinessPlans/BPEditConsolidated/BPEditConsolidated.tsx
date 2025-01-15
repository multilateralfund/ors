'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useEffect, useState } from 'react'

import { capitalize, map } from 'lodash'
import { useParams } from 'wouter'

import Loading from '@ors/components/theme/Loading/Loading'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import BEditTable from '../BPEdit/BPEditTable'
import BPRestoreEdit from '../BPEdit/BPRestoreEdit'
import { useGetActivities } from '../useGetActivities'
import BPHeaderEditConsolidated from './BPHeaderEditConsolidated'
import { useEditLocalStorageConsolidated } from './useLocalStorageConsolidated'
import { useBPListApi } from '../BPList/BPList'
import BPTabs from '../BPTabs'
import { BpFilesObject } from '../types'
import { useGetBpData } from '../BP/useGetBpData'
import { useStore } from '@ors/store'
import NotFoundPage from '@ors/app/not-found'

const BPEditConsolidated = () => {
  const { period, type } = useParams<{ period: string; type: string }>()
  const [year_start, year_end] = period.split('-')
  const formattedType = capitalize(type)

  const { setBPType } = useStore((state) => state.bpType)

  const getFilters = (reqType: string) => ({
    ...(reqType === 'activities'
      ? { bp_status: formattedType }
      : { status: formattedType }),
    year_end: year_end,
    year_start: year_start,
  })
  const bpFilters = getFilters('bp')

  const {
    loading,
    params,
    results: activities,
  } = useGetActivities(getFilters('activities'))
  const { results, loading: bpLoading } = useBPListApi(bpFilters)
  const { data: bpFiles } = useGetBpData(
    bpFilters,
    'api/business-plan/files/',
    'files',
  ) as any
  const { data, error } = useGetBpData(
    bpFilters,
    'api/business-plan/get/',
    'fullData',
  ) as any

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
      row_id: activities.length - index - 1,
    }))
  }, [activities])

  useEffect(() => {
    const formattedActivities = getFormattedActivities()

    if (formattedActivities && formattedActivities.length > 0) {
      handleSetForm(formattedActivities, false)
    }
  }, [getFormattedActivities, handleSetForm])

  useEffect(() => {
    setBPType(formattedType)
  }, [])

  return error ? (
    <NotFoundPage />
  ) : (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!bpLoading && results.length > 0 && (
        <BPHeaderEditConsolidated
          {...{ form, setWarnOnClose, type, results, bpForm, files, setForm }}
        />
      )}
      {!loading && (
        <BPRestoreEdit localStorage={localStorage} setForm={handleSetForm}>
          Unsaved {type} data exists for {year_start}-{year_end}, would you like
          to recover it?
        </BPRestoreEdit>
      )}
      {!loading && results.length > 0 && (
        <BPTabs
          {...{
            bpForm,
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
          <BEditTable
            {...{ form, loading, params }}
            isConsolidatedView={true}
            setForm={handleSetForm}
          />
        </BPTabs>
      )}
    </>
  )
}

export default BPEditConsolidated
