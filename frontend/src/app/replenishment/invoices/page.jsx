import InvoicesView from '@ors/components/manage/Blocks/Replenishment/InvoicesView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Invoices',
}

export default async function ReplenishmentInvoices() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <PageHeading>Replenishment - Invoices</PageHeading>
      </HeaderTitle>
      <InvoicesView />
    </PageWrapper>
  )
}
