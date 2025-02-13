import { useEffect } from 'react'
import useGetBpPeriods from './BPList/useGetBPPeriods'
import { getCurrentPeriodOption } from './utils'
import { useStore } from '@ors/store'
import { bpTypes } from './constants'

export const useSetInitialBpType = (yearRanges: any[], period: string) => {
  const [year_start] = period.split('-')
  const { periodOptions } = useGetBpPeriods(yearRanges)
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
    if (currentPeriod) {
      setBPType(initialBpType)
    }
  }, [initialBpType])

  return initialBpType
}
