import { useEffect } from 'react'
import { useStore } from '@ors/store'

import usePageTitle from '@ors/hooks/usePageTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

export default function BusinessPlansListLayout({ children }: any) {
  usePageTitle('Business Plans')

  const { fetchYearRanges, yearRanges } = useStore((state) => state.yearRanges)

  useEffect(() => {
    if (!yearRanges.data) {
      fetchYearRanges()
    }
  }, [])

  return (
    <PageWrapper className="print:p-0">
      <BPYearRangesProvider>{children}</BPYearRangesProvider>
    </PageWrapper>
  )
}
