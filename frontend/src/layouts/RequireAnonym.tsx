import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/shared/Header'
import { selectAuthToken } from '@/slices/authSlice'

interface Props {
  children?: React.ReactNode
}

export const RequireAnonym = ({ children }: Props) => {
  const token = useSelector(selectAuthToken)
  const location = useLocation()

  if (!token) {
    return (
      <>
        <Header />
        {children}
      </>
    )
  }

  return <Navigate to="/" state={{ from: location }} replace />
}
