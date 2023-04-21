import React from 'react'
import { useGetMeQuery } from '@/services/api'
import { Header } from '@/components/shared/Header'

interface Props {
  children?: React.ReactNode
}

export const LoggedInLayout = ({ children }: Props) => {
  useGetMeQuery(null)
  return (
    <>
      <Header />
      <div
        style={{
          height: '100vh',
        }}
      >
        <div>{children}</div>
      </div>
    </>
  )
}
