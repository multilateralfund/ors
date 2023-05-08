import { useState, useEffect } from 'react'
import { Sidebar as FlowbiteSidebar, TextInput } from 'flowbite-react'
import {
  HiChartPie,
  HiClipboard,
  HiCollection,
  HiInformationCircle,
  HiLogin,
  HiPencil,
  HiSearch,
  HiShoppingBag,
  HiUsers,
} from 'react-icons/hi'

export const Sidebar = () => {
  const [currentPage, setCurrentPage] = useState('')

  useEffect(() => {
    const newPage = window.location.pathname

    setCurrentPage(newPage)
  }, [setCurrentPage])

  return (
    <FlowbiteSidebar aria-label="Sidebar with multi-level dropdown example">
      <div className="flex h-full flex-col justify-between py-2">
        <div>
          <form className="pb-3 md:hidden">
            <TextInput
              icon={HiSearch}
              type="search"
              placeholder="Search"
              required
              size={32}
            />
          </form>
          <FlowbiteSidebar.Items>
            <FlowbiteSidebar.ItemGroup>
              <FlowbiteSidebar.Item
                href="/"
                icon={HiChartPie}
                className={
                  currentPage === '/' ? 'bg-gray-100 dark:bg-gray-700' : ''
                }
              >
                Dashboard
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="/e-commerce/products"
                icon={HiShoppingBag}
                className={
                  currentPage === '/e-commerce/products'
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : ''
                }
              >
                Products
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="/users/list"
                icon={HiUsers}
                className={
                  currentPage === '/users/list'
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : ''
                }
              >
                Users list
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="/authentication/sign-in"
                icon={HiLogin}
              >
                Sign in
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="/authentication/sign-up"
                icon={HiPencil}
              >
                Sign up
              </FlowbiteSidebar.Item>
            </FlowbiteSidebar.ItemGroup>
            <FlowbiteSidebar.ItemGroup>
              <FlowbiteSidebar.Item
                href="https://github.com/themesberg/flowbite-react/"
                icon={HiClipboard}
              >
                Docs
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="https://flowbite-react.com/"
                icon={HiCollection}
              >
                Components
              </FlowbiteSidebar.Item>
              <FlowbiteSidebar.Item
                href="https://github.com/themesberg/flowbite-react/issues"
                icon={HiInformationCircle}
              >
                Help
              </FlowbiteSidebar.Item>
            </FlowbiteSidebar.ItemGroup>
          </FlowbiteSidebar.Items>
        </div>
      </div>
    </FlowbiteSidebar>
  )
}
