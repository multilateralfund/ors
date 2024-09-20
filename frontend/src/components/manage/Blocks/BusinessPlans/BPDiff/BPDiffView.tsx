'use client'

import { useParams } from 'next/navigation'

import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { useStore } from '@ors/store'

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

  const diffData = useGetBPDiff({ agency_id, version, year_end, year_start })
  const { results } = diffData

  return (
    !!results && (
      <>
        <BPDiffHeader {...{ agency_id, pathParams, year_end, year_start }} />
        <BPYearRangesProvider>
          <BPDiffTable {...{ diffData }} />
        </BPYearRangesProvider>
      </>
    )
  )
}

export default BPDiffView
