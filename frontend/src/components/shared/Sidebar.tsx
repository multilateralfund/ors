import { useState, useEffect } from 'react'
import { Sidebar as FlowbiteSidebar, TextInput } from 'flowbite-react'
import { IoBarChart, IoPieChart } from 'react-icons/io5'

export const Sidebar = () => {
  const [currentPage, setCurrentPage] = useState('')

  useEffect(() => {
    const newPage = window.location.pathname

    setCurrentPage(newPage)
  }, [setCurrentPage])

  return (
    <FlowbiteSidebar aria-label="Sidebar with multi-level dropdown example">
      <div className="flex h-full flex-col justify-between py-2">
        <FlowbiteSidebar.Items className="flex-col">
          <FlowbiteSidebar.ItemGroup>
            <FlowbiteSidebar.Item
              href="/"
              icon={IoPieChart}
              className={
                currentPage === '/' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }
            >
              Dashboard
            </FlowbiteSidebar.Item>
            <FlowbiteSidebar.Item
              href="/e-commerce/products"
              icon={IoBarChart}
              className={
                currentPage === '/e-commerce/products'
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : ''
              }
            >
              Reports
            </FlowbiteSidebar.Item>
          </FlowbiteSidebar.ItemGroup>
        </FlowbiteSidebar.Items>
      </div>
    </FlowbiteSidebar>
  )
}
