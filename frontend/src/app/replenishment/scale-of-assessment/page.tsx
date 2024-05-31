import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

import { PERIOD } from '@ors/components/manage/Blocks/Replenishment/constants'

export const metadata: Metadata = {
  title: 'Replenishment',
}

export default async function Replenishment() {
  redirect(`/replenishment/scale-of-assessment/${PERIOD}`)
}

