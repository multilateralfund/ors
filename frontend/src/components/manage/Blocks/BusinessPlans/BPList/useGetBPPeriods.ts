import { useMemo } from 'react'
import { reduce } from 'lodash'

export default function useGetBpPeriods(yearRanges: any) {
  const periodOptions = useMemo(() => {
    return reduce(
      yearRanges,
      (acc: any, yearObj: any) => {
        acc.push({
          label: `${yearObj.year_start}-${yearObj.year_end}`,
          value: `${yearObj.year_start}-${yearObj.year_end}`,
          year_start: yearObj.year_start,
          status: yearObj.status,
        })
        acc.sort((a: any, b: any) => b.year_start - a.year_start)
        return acc
      },
      [],
    )
  }, [yearRanges])

  return { periodOptions }
}
