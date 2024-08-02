import React from 'react'

import { Metadata } from 'next'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper className="max-w-screen-xl xl:px-0">
      <HeaderTitle>
        <PageHeading className="mx-auto max-w-screen-xl">
          Business Plans
        </PageHeading>
      </HeaderTitle>
      <div>Create a business plan</div>
    </PageWrapper>
  )
}
