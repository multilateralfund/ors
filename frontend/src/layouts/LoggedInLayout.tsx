import React from 'react'
import { useGetMeQuery } from '@/services/api'

interface Props {
  children?: React.ReactNode
}

export const LoggedInLayout = ({ children }: Props) => {
  useGetMeQuery(null)
  return (
    <div
      style={{
        height: '100vh',
      }}
    >
      <div>{children}</div>
    </div>
  )
}
