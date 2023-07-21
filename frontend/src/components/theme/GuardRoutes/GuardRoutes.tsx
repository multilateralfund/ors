'use client'
import React from 'react'

import { usePathname, useRouter } from 'next/navigation'

import config from '@ors/config'
import useStore from '@ors/store'

export default function GuardRoutes() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useStore((state) => state.user?.data)

  React.useEffect(() => {
    if (!config.settings.unguardedRoutes.includes(pathname) && !user) {
      router.push('/login')
    }
  }, [user, pathname, router])

  return null
}
