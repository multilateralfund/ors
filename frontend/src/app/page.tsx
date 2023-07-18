import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
}

export default function Home() {
  return <main className="container mx-auto px-4"></main>
}
