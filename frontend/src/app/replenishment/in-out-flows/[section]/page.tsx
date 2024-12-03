import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import InOutFlowsView from '@ors/components/manage/Blocks/Replenishment/InOutFlows/InOutFlowsView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentInOutFlowsBySection() {
  usePageTitle('Replenishment - In/out flows')
  const { section } = useParams<Record<string, string>>()

  return (
    <>
      <title>Replenishment - In/out flows</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>In/out flows</ReplenishmentHeading>
        <DownloadButtons />
        <InOutFlowsView section={section} />
      </PageWrapper>
    </>
  )
}
