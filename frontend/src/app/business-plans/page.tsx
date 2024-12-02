'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'

export default function BusinessPlans() {
  const router = useRouter()

  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)

  useEffect(() => {
    if (periodOptions.length > 0) {
      router.replace(
        `/business-plans/list/activities/${periodOptions[0].value}`,
      )
    }
  }, [periodOptions, router])
}
