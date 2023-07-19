import Header from '../Header/Header'

export default function DefaultView({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="grid-cols-1">{children}</main>
    </>
  )
}
