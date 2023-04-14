// import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

type Props = {
  children?: React.ReactNode
}

export const RequireAnonym: React.FC<Props> = ({ children }) => {
  // const token = useSelector(selectAuthToken)
  const location = useLocation()
  const token = false

  if (!token) {
    return <>{children}</>
  }

  return <Navigate to="/" state={{ from: location }} replace />
}
