import React from 'react'

export default function SimpleView({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="grid-cols-1">{children}</main>
    </>
  )
}
