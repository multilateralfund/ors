import { Outlet } from 'react-router-dom'
import { Header } from '../components/shared/Header'

export const BaseLayout = () => {
  return (
    <>
      <div className="container ">
        <Header />
        <Outlet />
      </div>
    </>
  )
}
