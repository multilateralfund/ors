import { useMemo } from 'react'

import { useStore } from '@ors/store'

export default function useGetBpPeriods() {
  const bpSlice = useStore((state) => state.businessPlans)

  const periodOptions = useMemo(() => {
    return bpSlice.yearRanges.data.reduce((acc: any, yearObj: any) => {
      acc.push({
        label: `${yearObj.year_start}-${yearObj.year_end}`,
        value: `${yearObj.year_start}-${yearObj.year_end}`,
        year_start: yearObj.year_start,
      })
      acc.sort((a: any, b: any) => b.year_start - a.year_start)
      return acc
    }, [])
  }, [bpSlice.yearRanges.data])

  return { periodOptions }
}
