'use client'

import React from 'react'

export default function DefaultView({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="grid-cols-1">{children}</main>
}
