import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import InvoicesView from '@ors/components/manage/Blocks/Replenishment/InvoicesView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Invoices',
}

export default async function ReplenishmentInvoices(props) {
  const { period } = props.params
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading>Invoices</ReplenishmentHeading>
      <InvoicesView period={period} />
    </PageWrapper>
  )
}
