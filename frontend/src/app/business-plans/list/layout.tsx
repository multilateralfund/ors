'use client'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

export default function BusinessPlansListLayout({ children }: any) {
  return (
    <PageWrapper className="max-w-screen-xl print:p-0">
      <BPYearRangesProvider>{children}</BPYearRangesProvider>
    </PageWrapper>
  )
}
