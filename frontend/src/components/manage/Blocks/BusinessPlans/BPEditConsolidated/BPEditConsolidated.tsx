'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useEffect, useState } from 'react'

import { capitalize, map, filter, uniq } from 'lodash'
import { useParams } from 'wouter'

import Loading from '@ors/components/theme/Loading/Loading'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import BEditTable from '../BPEdit/BPEditTable'
import BPRestoreEdit from '../BPEdit/BPRestoreEdit'
import { useGetActivities } from '../useGetActivities'
import BPHeaderEditConsolidated from './BPHeaderEditConsolidated'
import { useEditLocalStorageConsolidated } from './useLocalStorageConsolidated'
import BPTabs from '../BPTabs'
import { BpFilesObject } from '../types'
import { useGetBpData } from '../BP/useGetBpData'
import { useStore } from '@ors/store'
import NotFoundPage from '@ors/app/not-found'
import { useGetChemicalTypes } from '../useGetChemicalTypes'

const BPEditConsolidated = ({ activitiesRef, isFirstRender }: any) => {
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

  const { loading, params, results } = useGetActivities(
    getFilters('activities'),
  )
  const { data: bpFiles } = useGetBpData(
    bpFilters,
    'api/business-plan/files/',
    'files',
  ) as any
  const {
    data,
    error,
    loading: bpLoading,
  } = useGetBpData(bpFilters, 'api/business-plan/get/', 'fullData') as any
  const { business_plan } = data || {}
  const chemicalTypes = useGetChemicalTypes()

  const { activeTab: storeActiveTab } = useStore(
    (state) => state.bp_current_tab,
  )

  const [activeTab, setActiveTab] = useState(storeActiveTab)
  const [form, setForm] = useState<Array<ApiEditBPActivity> | undefined>(
    undefined,
  )
  const [bpForm, setBpForm] = useState<any>()
  const [files, setFiles] = useState<BpFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const [isDataFormatted, setIsDataFormatted] = useState(false)
  const [warnOnClose, setWarnOnClose] = useState(false)
  useVisibilityChange(warnOnClose)

  const localStorage = useEditLocalStorageConsolidated(
    (results as ApiEditBPActivity[]) ?? [],
    type,
    period,
  )

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
    if (!results) {
      return null
    }

    const addedActivities = filter(
      results,
      (activity) => activity.id === activity.initial_id,
    )
      .map((activity) => activity.initial_id)
      .sort((activId1, activId2) => (activId1 ?? 0) - (activId2 ?? 0))

    activitiesRef.current.all = isFirstRender.current
      ? [...(activitiesRef.current.all || [])]
      : uniq([
          ...addedActivities,
          ...(activitiesRef.current.edited || []),
          ...(activitiesRef.current.all || []),
        ])

    const sortedActivities = [...results].sort((activ1, activ2) => {
      const index1 = activitiesRef.current.all.indexOf(activ1.initial_id)
      const index2 = activitiesRef.current.all.indexOf(activ2.initial_id)

      if (index1 !== -1 && index2 !== -1) return index1 - index2

      if (index1 !== -1) return -1
      if (index2 !== -1) return 1

      return 0
    })

    activitiesRef.current.edited = []

    return map(sortedActivities, (activity, index) => ({
      ...activity,
      row_id: sortedActivities.length - index - 1,
    }))
  }, [results])

  useEffect(() => {
    if (!bpForm && business_plan)
      setBpForm({
        meeting: business_plan.meeting_id,
        decision: business_plan.decision_id,
      })
  }, [business_plan])

  useEffect(() => {
    const formattedActivities = getFormattedActivities()

    if (formattedActivities && formattedActivities.length > 0) {
      setIsDataFormatted(true)
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
      {!bpLoading && business_plan && (
        <BPHeaderEditConsolidated
          {...{
            form,
            setWarnOnClose,
            type,
            business_plan,
            bpForm,
            files,
            setForm,
            isFirstRender,
          }}
        />
      )}
      {!loading && (
        <BPRestoreEdit
          localStorage={localStorage}
          setForm={handleSetForm}
          activitiesRef={activitiesRef}
          results={results}
        >
          Unsaved {type} data exists for {year_start}-{year_end}, would you like
          to recover it?
        </BPRestoreEdit>
      )}
      {!loading && business_plan && (
        <BPTabs
          {...{
            bpForm,
            activeTab,
            setActiveTab,
            setBpForm,
            setFiles,
            files,
            bpFiles,
            business_plan,
            data,
          }}
          isConsolidatedBp
        >
          <BEditTable
            {...{
              form,
              loading,
              params,
              chemicalTypes,
              results,
              isDataFormatted,
              activitiesRef,
            }}
            isConsolidatedView={true}
            setForm={handleSetForm}
          />
        </BPTabs>
      )}
    </>
  )
}

export default BPEditConsolidated
