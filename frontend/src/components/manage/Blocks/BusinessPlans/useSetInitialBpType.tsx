import { useEffect } from 'react'
import useGetBpPeriods from './BPList/useGetBPPeriods'
import { getCurrentPeriodOption, getStartEndYears } from './utils'
import { useStore } from '@ors/store'
import { bpTypes } from './constants'

export const useSetInitialBpType = (yearRanges: any[], period: string) => {
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const [year_start] = getStartEndYears(periodOptions, period)
  const currentPeriod = getCurrentPeriodOption(periodOptions, year_start)

  const { bpType, setBPType } = useStore((state) => state.bpType)

  const periodHasBpType = (bpType: string) =>
    currentPeriod?.status.includes(bpType) && bpType

  const firstBpType = bpTypes[0].label
  const secondBpType = bpTypes[1].label

  const initialBpType =
    periodHasBpType(bpType) ||
    periodHasBpType(secondBpType) ||
    periodHasBpType(firstBpType) ||
    ''

  useEffect(() => {
    setBPType(initialBpType)
  }, [initialBpType])

  return initialBpType
}
