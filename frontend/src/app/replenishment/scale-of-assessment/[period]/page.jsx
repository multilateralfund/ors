'use client'

import { useContext } from 'react'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import SoAContext from '@ors/contexts/Replenishment/SoAContext'
import SoAProvider from '@ors/contexts/Replenishment/SoAProvider'

function SoAContent(props) {
  const { period } = props

  const ctx = useContext(SoAContext)

  return (
    <>
      <ReplenishmentHeading showPeriodSelector={true}>
        <div className="flex items-center gap-x-2">
          <div>Scale of assessment</div>
          <div className="rounded bg-mlfs-hlYellow px-1 text-base font-medium uppercase text-primary">
            Version {ctx.version.id} ({ctx.version.status})
          </div>
        </div>
      </ReplenishmentHeading>
      <DownloadButtons />
      <SAView period={period} />
    </>
  )
}

export default function ReplenishmentScaleOfAssessment(props) {
  const { period } = props.params
  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <SoAProvider startYear={period.split('-')[0]}>
        <SoAContent period={period} />
      </SoAProvider>
    </PageWrapper>
  )
}
