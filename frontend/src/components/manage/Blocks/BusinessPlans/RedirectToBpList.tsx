import { useContext } from 'react'

import { Link } from 'wouter'

import { IoReturnUpBack } from 'react-icons/io5'
import useGetBpPeriods from './BPList/useGetBPPeriods'
import { getCurrentTriennium, getLatestBpYearRange } from './utils'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'

export const RedirectToBpList = ({
  currentYearRange,
}: {
  currentYearRange?: string
}) => {
  const currentTriennium = getCurrentTriennium()

  const { yearRanges } = useContext(BPYearRangesContext)
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const latestBpYearRange = getLatestBpYearRange(periodOptions)

  const bpListUrl = `/business-plans/list/activities/${currentYearRange || latestBpYearRange?.value || currentTriennium}`

  return (
    <div className="w-fit">
      <Link className="text-black no-underline" href={bpListUrl}>
        <div className="mb-2 flex items-center gap-2 text-lg uppercase">
          <IoReturnUpBack size={18} />
          Business Plans
        </div>
      </Link>
    </div>
  )
}
