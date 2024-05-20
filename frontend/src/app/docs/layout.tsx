import type { Metadata } from 'next'

import React from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Documentation',
}

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageWrapper className="max-w-screen-xl lg:px-0">
      <div>{children}</div>
    </PageWrapper>
  )
}
