import { useCookies } from 'react-cookie'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader'

interface Props {
  allowedRoles?: string[]
}

export const RequireUser = ({ allowedRoles }: Props) => {
  const [cookies] = useCookies()
  const location = useLocation()

  /*const { isLoading, isFetching } = userApi.endpoints.getMe.useQuery(null, {
    skip: false,
    refetchOnMountOrArgChange: true,
  })

  const loading = isLoading || isFetching

  const user = userApi.endpoints.getMe.useQueryState(null, {
    selectFromResult: ({ data }) => data!,
  })

  if (loading) {
    return <FullScreenLoader />
  }*/

  /*
    Need to be added after we have roles
    return (cookies.logged_in || user) &&
      allowedRoles.includes(user?.role as string) ? (
      <Outlet />
    ) : cookies.logged_in && user ? (
      <Navigate to="/unauthorized" state={{ from: location }} replace />
    ) : (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  */
  return cookies['orsauth'] ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  )
}
