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
        <div className="content grid grid-rows-[auto_1fr_auto] overflow-hidden">
          <div id="top-control" className="z-10" />
          {children}
          <div id="bottom-control" className="z-10" />
        </div>
      </main>
    </>
  )
}
