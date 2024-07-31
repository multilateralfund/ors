'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'

export default function BusinessPlans() {
  const router = useRouter()
  const { periodOptions } = useGetBpPeriods()

  useEffect(() => {
    if (periodOptions.length > 0) {
      router.replace(`/business-plans/all/plans/${periodOptions[0].value}`)
    }
  }, [periodOptions, router])
}
