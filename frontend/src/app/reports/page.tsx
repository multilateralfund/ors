import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import React from 'react'

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Reports',
}

export default async function Reports() {
  return (
    <PageWrapper className="mx-4 mt-4 w-full">
      <div className="rounded bg-white p-4 shadow">
        <h1>Reports</h1>
      </div>
    </PageWrapper>
  )
}
