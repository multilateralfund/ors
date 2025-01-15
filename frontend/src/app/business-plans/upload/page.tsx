import { useEffect } from 'react'
import { useStore } from '@ors/store'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPUploadWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function BusinessPlans() {
  usePageTitle('Business Plans Upload')

  const { fetchYearRanges, yearRanges } = useStore((state) => state.yearRanges)

  useEffect(() => {
    if (!yearRanges.data) {
      fetchYearRanges()
    }
  }, [])

  return (
    <PageWrapper>
      <BPUploadWrapper />
    </PageWrapper>
  )
}
