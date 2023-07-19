export default function Error({
  statusCode,
  message,
}: {
  statusCode: React.ReactNode
  message: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <h1>{statusCode}</h1>
      <span className="mx-4 h-4 border-r border-solid border-r-secondary" />
      <h2>{message}</h2>
    </div>
  )
}
