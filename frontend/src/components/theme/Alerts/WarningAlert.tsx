import { ReactNode } from 'react'

import { IoInformationCircleOutline } from 'react-icons/io5'
import { Alert } from '@mui/material'

const WarningAlert = ({ content }: { content: ReactNode }) => (
  <Alert
    className="mb-2 w-fit bg-mlfs-bannerColor px-2 py-0"
    icon={<IoInformationCircleOutline size={20} />}
    severity="info"
  >
    {content}
  </Alert>
)

export default WarningAlert
