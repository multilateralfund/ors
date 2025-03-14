export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full bg-[url('/images/green.jpg')] bg-cover">
      {children}
    </div>
  )
}
