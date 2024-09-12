import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Replenishment',
}

export default async function Replenishment() {
  redirect('/replenishment/dashboard')
}
