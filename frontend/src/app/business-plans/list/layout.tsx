import { useEffect } from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsProvider from '@ors/contexts/PermissionsProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import usePageTitle from '@ors/hooks/usePageTitle'
import { useStore } from '@ors/store'

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
      <BPYearRangesProvider>
        <PermissionsProvider>{children}</PermissionsProvider>
      </BPYearRangesProvider>
    </PageWrapper>
  )
}
