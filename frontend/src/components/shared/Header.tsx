import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Navbar, DarkThemeToggle, useTheme, Dropdown } from 'flowbite-react'
import { selectUser, setTheme } from '@/slices/userSlice'
import { useLogoutMutation } from '@/services/api'
import { imgSrc } from '@/utils/assets'
import { LangSwitcher } from './LangSwitcher'
import { IUser } from '@/types/User'

export const Header = () => {
  const { user } = useSelector(selectUser)
  const dispatch = useDispatch()
  const theme = useTheme()

  const [logoutUser, { isSuccess, isLoading }] = useLogoutMutation()

  useEffect(() => {
    if (isSuccess) {
      window.location.href = '/login'
    }
  }, [isLoading])

  useEffect(() => {
    dispatch(setTheme({ mode: theme?.mode }))
  }, [theme.mode])

  const onConfirmLogout = () => {
    logoutUser()
  }

  return (
    <Navbar fluid>
      <div className="w-full p-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <Navbar.Brand to="/">
            <div className="self-center whitespace-nowrap text-xl font-semibold dark:text-white w-10">
              <img
                src={imgSrc('/assets/logos/mlf_icon.png')}
                alt="logo"
                className="w-auto h-auto"
              />
            </div>
            <span className="pl-2 dark:text-white">MLFS</span>
          </Navbar.Brand>
          <div className="flex md:order-2 items-center dark:text-white">
            <LangSwitcher />
            {user && (
              <div className="ml-4">
                <UserInfo user={user} onLogout={onConfirmLogout} />
              </div>
            )}
            <div className="ml-2">
              <DarkThemeToggle />
            </div>
            <Navbar.Toggle />
          </div>
        </div>
      </div>
      <Navbar.Collapse />
    </Navbar>
  )
}

const UserInfo = ({
  user,
  onLogout,
}: {
  user: IUser | undefined
  onLogout: () => void
}) => {
  const navigate = useNavigate()
  return (
    <Dropdown label={user?.first_name} inline>
      <Dropdown.Item onClick={() => navigate('/profile')}>
        Profile
      </Dropdown.Item>
      <Dropdown.Item onClick={() => window.open('/admin', '_blank')}>
        Admin
      </Dropdown.Item>
      <Dropdown.Item onClick={onLogout}>Logout</Dropdown.Item>
    </Dropdown>
  )
}
