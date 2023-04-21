import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUser } from '@/slices/userSlice'

export const ProfilePage = () => {
  const { user } = useSelector(selectUser)

  return <div>Welcome, {user?.first_name}</div>
}
