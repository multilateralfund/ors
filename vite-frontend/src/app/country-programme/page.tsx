import type { Metadata } from 'next'

import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Country Programme',
}

export default function CountryProgramme() {
  redirect('/country-programme/reports')
}
