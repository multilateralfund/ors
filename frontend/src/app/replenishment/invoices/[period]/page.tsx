import type { Metadata } from 'next'

import { Typography } from '@mui/material'

import InvoicesTableView from '@ors/components/manage/Blocks/Replenishment/InvoicesTableView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Replenishment - Invoices',
}

export default async function ReplenishmentInvoices(props: any) {
  const { period } = props.params
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Replenishment - Invoices
        </Typography>
      </HeaderTitle>
      <InvoicesTableView period={period} />
    </PageWrapper>
  )
}
