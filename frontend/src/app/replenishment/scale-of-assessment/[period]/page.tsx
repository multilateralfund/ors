import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import SAHeading from '@ors/components/manage/Blocks/Replenishment/SAView/SAHeading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import SoAProvider from '@ors/contexts/Replenishment/SoAProvider'

export default function ReplenishmentScaleOfAssessment() {
  usePageTitle('Replenishment - Scale of assessment')
  const { period } = useParams<Record<string, string>>()
  return (
    <>
      <title>Replenishment - Scale of assessment</title>
      <PageWrapper
        className="w-full rounded-b-lg bg-white p-4"
        defaultSpacing={false}
      >
        <SoAProvider startYear={period.split('-')[0]}>
          <SAHeading />
          <SAView period={period} />
        </SoAProvider>
      </PageWrapper>
    </>
  )
}
