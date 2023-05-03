import { useDispatch, useSelector } from 'react-redux'
import { logout } from '@/slices/authSlice'
import { selectUser } from '@/slices/userSlice'
import { Navbar } from 'flowbite-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { LangSwitcher } from './LangSwitcher'

export const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector(selectUser)

  const onConfirmLogout = () => {
    dispatch(logout())

    window.location.href = '/'
  }

  const onLogin = () => navigate('/login')

  return (
    <Navbar fluid={true}>
      <Navbar.Brand to="/">
        <div className="self-center whitespace-nowrap text-xl font-semibold dark:text-white w-[200px]">
          <Logo />
        </div>
      </Navbar.Brand>
      <div className="flex md:order-2 items-center">
        {user ? (
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
        ) : (
          <LangSwitcher />
        )}

        <Navbar.Toggle />
      </div>
      <Navbar.Collapse></Navbar.Collapse>
    </Navbar>
  )
}
