import { useSelector } from 'react-redux'
import { selectUser } from '@/slices/userSlice'
import { Navbar } from 'flowbite-react'
import { LangSwitcher } from './LangSwitcher'
import { useLogoutMutation } from '@/services/api'
import { imgSrc } from '@/utils/assets'
import { useEffect } from 'react'

export const Header = () => {
  const { user } = useSelector(selectUser)

  const [logoutUser, { isSuccess, isLoading }] = useLogoutMutation()

  useEffect(() => {
    if (isSuccess) {
      window.location.href = '/login'
    }
  }, [isLoading])

  const onConfirmLogout = () => {
    logoutUser()
  }

  return (
    <Navbar fluid={true}>
      {user && (
        <Navbar.Brand to="/">
          <div className="self-center whitespace-nowrap text-xl font-semibold dark:text-white w-10">
            <img
              src={imgSrc('/assets/logos/mlf_icon.png')}
              alt="logo"
              className="w-auto h-auto"
            />
          </div>
          <span className="pl-2">MLFS</span>
        </Navbar.Brand>
      )}
      <div className="flex md:order-2 items-center">
        {user && (
          <>
            <span>Hi {user.first_name}</span>
            <a
              href="#"
              onClick={onConfirmLogout}
              className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800"
            >
              Logout
            </a>
          </>
        )}
        <LangSwitcher />
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse></Navbar.Collapse>
    </Navbar>
  )
}
