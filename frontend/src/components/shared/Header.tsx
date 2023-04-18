import React from 'react'
import { useDispatch } from 'react-redux'
// import { useMe } from '../../hooks/useMe'
import { logout } from '../../slices/authSlice'
import { Navbar, Button, CustomFlowbiteTheme } from 'flowbite-react'
import { useNavigate } from 'react-router-dom'

export const Header = () => {
  // const { me, isLoading } = useMe()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const onConfirmLogout = () => {
    dispatch(logout())
  }

  const navbarTheme: CustomFlowbiteTheme = {
    navbar: {
      root: {
        base: 'bg-grey-50',
      },
    },
  }

  return (
    <Navbar fluid={true}>
      <Navbar.Brand to="/">
        <div className="self-center whitespace-nowrap text-xl font-semibold dark:text-white w-[200px]">
          <img
            className="w-auto h-auto"
            src="http://www.multilateralfund.org/_layouts/images/UNMFNewLogo.bmp"
            alt="logo"
          />
        </div>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Button onClick={() => navigate('/login')}>Login</Button>
        <Navbar.Toggle />
      </div>
      <Navbar.Collapse></Navbar.Collapse>
    </Navbar>
  )
}
