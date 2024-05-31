import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Replenishment',
}

export default async function Replenishment() {
  redirect('/replenishment/scale-of-assessment')
}
