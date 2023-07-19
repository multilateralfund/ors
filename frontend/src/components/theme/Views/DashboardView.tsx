import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'

export default function DashboardView({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="grid-cols-[auto_1fr]">
        <Sidebar />
        {children}
      </main>
    </>
  )
}
