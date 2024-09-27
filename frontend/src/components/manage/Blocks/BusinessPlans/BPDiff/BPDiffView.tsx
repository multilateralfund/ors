'use client'

import { useEffect, useMemo } from 'react'

import { useParams } from 'next/navigation'

import Loading from '@ors/components/theme/Loading/Loading'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { useStore } from '@ors/store'

import { useGetBPVersions } from '../BP/useGetBPVersions'
import { BpDiffPathParams } from '../types'
import { getAgencyByName } from '../utils'
import BPDiffHeader from './BPDiffHeader'
import BPDiffTable from './BPDiffTable'
import { useGetBPDiff } from './useGetBPDiff'

const BPDiffView = () => {
  const pathParams = useParams<BpDiffPathParams>()
  const { agency, period, version } = pathParams

  const [year_start, year_end] = period.split('-').map(Number)

  const commonSlice = useStore((state) => state.common)
  const { id: agency_id } = getAgencyByName(commonSlice, agency)

  const { setCurrentVersion, setPreviousVersion } = useStore(
    (state) => state.bp_diff_versions,
  )

  const bpVersions = useGetBPVersions({
    ...{ agency_id, year_end, year_start },
  })

  const { results = [] } = bpVersions

  const currentVersionObject = results.find(
    (vers) => vers.version === parseInt(version),
  )

  const currentVersion = useMemo(
    () => currentVersionObject?.version || 0,
    [currentVersionObject],
  )

  const previousVersion = useMemo(() => {
    const currentVersionIndex = results.indexOf(currentVersionObject)
    const previousVersionObject = results[currentVersionIndex + 1]

    return previousVersionObject?.version || 0
  }, [currentVersionObject, results])

  useEffect(() => {
    setCurrentVersion(currentVersion)
    setPreviousVersion(previousVersion)
  }, [currentVersion, previousVersion, setCurrentVersion, setPreviousVersion])

  const diffData = useGetBPDiff({ agency_id, version, year_end, year_start })
  const { loading, results: resultsDiff } = diffData

  return (
    !!resultsDiff && (
      <>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={loading}
        />
        <BPDiffHeader {...{ pathParams }} />
        <BPYearRangesProvider>
          <BPDiffTable {...{ diffData }} />
        </BPYearRangesProvider>
      </>
    )
  )
}

export default BPDiffView
