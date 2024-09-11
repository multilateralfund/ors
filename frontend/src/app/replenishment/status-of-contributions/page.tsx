import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentStatusOfContribution() {
  redirect('/replenishment/status-of-contributions/summary')
}
