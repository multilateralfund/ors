import { Skeleton, Typography } from '@mui/material'

export default function TextWidgetLoading() {
  return (
    <>
      <Typography className="mb-2">
        <Skeleton className="rounded" animation="wave" width={100} />
      </Typography>
      <Skeleton className="rounded" animation="wave" height={40} width="100%" />
    </>
  )
}
