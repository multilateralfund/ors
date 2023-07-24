import { Typography } from '@mui/material'

export default function Error({
  message,
  statusCode,
}: {
  message: React.ReactNode
  statusCode: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Typography component="h1" variant="h4">
        {statusCode}
      </Typography>
      <span className="mx-4 h-4 border-r border-solid border-r-secondary" />
      <Typography component="h2" fontWeight="normal" variant="h6">
        {message}
      </Typography>
    </div>
  )
}
