import { useMemo } from 'react'
import { reduce } from 'lodash'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years.ts'
import { PeriodSelectorOption } from '@ors/components/manage/Blocks/Replenishment/types.ts'

export type BpPeriod = PeriodSelectorOption & {
  year_start: number
}

export default function useGetBpPeriods(yearRanges: ApiBPYearRange[]) {
  const periodOptions = useMemo(() => {
    return reduce(
      yearRanges,
      (acc: BpPeriod[], yearObj) => {
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
