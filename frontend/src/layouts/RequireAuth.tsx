import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectAuthToken } from '@/slices/authSlice'

interface Props {
  children?: React.ReactNode
}

export const RequireAuth = ({ children }: Props) => {
  const token = useSelector(selectAuthToken)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
