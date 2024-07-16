'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import InvoicesView from '@ors/components/manage/Blocks/Replenishment/InvoicesView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentInvoices(props) {
  const { period } = props.params
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading
        extraPeriodOptions={[{ label: 'All', value: '' }]}
        showPeriodSelector={true}
      >
        Invoices
      </ReplenishmentHeading>
      <DownloadButtons />
      <InvoicesView period={period} />
    </PageWrapper>
  )
}
