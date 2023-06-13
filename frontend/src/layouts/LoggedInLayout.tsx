import { useGetMeQuery } from '@/services/api'
import { Button } from 'flowbite-react'
import { Header } from '@/components/shared/Header'
import { Sidebar } from '@/components/shared/Sidebar'
import { useNavigate } from 'react-router-dom'

interface Props {
  children?: React.ReactNode
  isFooter?: boolean
}

export const LoggedInLayout = ({ children, isFooter = false }: Props) => {
  useGetMeQuery(null)
  return (
    <>
      <Header />
      <div className="flex items-start pt-10">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
      {isFooter && <FooterWithActions />}
    </>
  )
}

const MainContent = ({ children }: Props) => {
  return (
    <main className="relative h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 lg:ml-32 lg:pb-12 px-4 pt-6">
      {children}
    </main>
  )
}

const FooterWithActions = () => {
  const navigate = useNavigate()
  return (
    <div className="w-full fixed bottom-0 lg:pl-36 lg:pr-4 py-4 bg-white dark:bg-gray-800 shadow-inner">
      <div className="flex justify-between">
        <div className="">
          <Button color="red" size="xs" onClick={() => navigate('/reports')}>
            Close
          </Button>
        </div>
        <div className="flex">
          <Button.Group outline={true}>
            <Button color="gray" size="xs">
              Recall
            </Button>
            <Button color="gray" size="xs">
              Revise
            </Button>
          </Button.Group>
          <div className="ml-5">
            <Button color="green" size="xs">
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
