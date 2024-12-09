import { Link } from 'wouter'

import { IoReturnUpBack } from 'react-icons/io5'
import { useGetYearRanges } from './useGetYearRanges'
import useGetBpPeriods from './BPList/useGetBPPeriods'
import { getLatestBpYearRange } from './utils'

export const RedirectToBpList = ({
  currentYearRange,
}: {
  currentYearRange?: string
}) => {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const latestBpYearRange = getLatestBpYearRange(periodOptions)

  const bpListUrl = `/business-plans/list/activities/${currentYearRange || latestBpYearRange?.value}`

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
