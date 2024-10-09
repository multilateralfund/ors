import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Replenishment - In/out flows',
}

export default function ReplenishmentInOutFlows() {
  redirect('/replenishment/in-out-flows/invoices')
}
