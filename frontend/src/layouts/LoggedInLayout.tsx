import React from 'react'
// import { useGetMeQuery } from "../services/api";

type Props = {
  children?: React.ReactNode
}

export const LoggedInLayout: React.FC<Props> = ({ children }) => {
  // useGetMeQuery(null);
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
