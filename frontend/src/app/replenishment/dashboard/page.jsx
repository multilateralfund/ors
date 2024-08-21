import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Replenishment - Dashboard',
}

export default function ReplenishmentDashboard() {
  redirect('/replenishment/dashboard/cummulative')
}
