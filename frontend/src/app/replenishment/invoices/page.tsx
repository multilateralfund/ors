'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import InvoicesView from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoicesView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentInvoices() {
  return (
    <>
      <title>Replenishment - Invoices</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Invoices</ReplenishmentHeading>
        <DownloadButtons />
        <InvoicesView />
      </PageWrapper>
    </>
  )
}
