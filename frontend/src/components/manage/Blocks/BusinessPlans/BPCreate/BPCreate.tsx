'use client'

import BPCreateProvider, {
  useBPCreate,
  useBPCreateDispatch,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/BPCreateProvider'
import { ActionType } from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'
import { useStore } from '@ors/store'

import useGetBpPeriods from '../BPList/useGetBPPeriods'
import { RedirectToBpList } from '../RedirectToBpList'
import { useGetYearRanges } from '../useGetYearRanges'

function BPCreate() {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { bpFilters } = useStore((state) => state.bpFilters)

  const currentYearRange = bpFilters.range
    ? bpFilters.range
    : periodOptions?.[0]?.value

  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()

  return (
    <>
      <RedirectToBpList {...{ currentYearRange }} />
      <div>Create a business plan</div>
      <button
        disabled={ctx.activeTab === 0}
        onClick={() => dispatch({ payload: 0, type: ActionType.setActiveTab })}
      >
        Activities
      </button>
      <button
        disabled={ctx.activeTab === 1}
        onClick={() => dispatch({ payload: 1, type: ActionType.setActiveTab })}
      >
        Details
      </button>
    </>
  )
}

export default function BPCreateWrapper() {
  return (
    <BPCreateProvider>
      <BPCreate />
    </BPCreateProvider>
  )
}
