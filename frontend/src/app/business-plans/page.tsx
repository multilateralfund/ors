'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

export default function BusinessPlans() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/business-plans/all/plans/`)
  }, [router])
}
