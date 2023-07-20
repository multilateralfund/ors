import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function Loading() {
  return (
    <Box className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-transparent dark:bg-transparent">
      <CircularProgress />
    </Box>
  )
}
