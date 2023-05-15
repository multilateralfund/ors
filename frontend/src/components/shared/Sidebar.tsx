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
    <FlowbiteSidebar className="w-32">
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
              href="/reports"
              icon={IoBarChart}
              className={
                currentPage === '/reports' ? 'bg-gray-100 dark:bg-gray-700' : ''
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
