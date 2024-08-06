'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'

export default function BusinessPlans() {
  const router = useRouter()
  const { periodOptions } = useGetBpPeriods()

  useEffect(() => {
    router.replace(`/business-plans/list/plans/${periodOptions[0].value}`)
  }, [periodOptions, router])
}
