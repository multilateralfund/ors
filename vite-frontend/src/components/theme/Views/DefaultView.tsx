import React from 'react'

import Header from '@ors/components/theme/Header/DefaultHeader'

export default function DefaultView({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="grid-cols-1">{children}</main>
    </>
  )
}
