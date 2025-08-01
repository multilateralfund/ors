import { IoMdCheckmarkCircleOutline } from 'react-icons/io'
import { Alert, Typography } from '@mui/material'

const WarningAlert = ({ content }: { content: string }) => (
  <Alert
    className="flex w-fit items-center border-0 bg-mlfs-bannerColor text-primary"
    severity="info"
    icon={<IoMdCheckmarkCircleOutline color="#002A3C" />}
  >
    <Typography className="text-lg leading-none">{content}</Typography>
  </Alert>
)

export default WarningAlert
