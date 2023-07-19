'use client'
import { usePathname, useRouter } from 'next/navigation'

import config from '@ors/registry'
import useStore from '@ors/store'
import React from 'react'

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
