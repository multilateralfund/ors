import { ReactNode } from 'react'

import { MdErrorOutline } from 'react-icons/md'
import { Alert } from '@mui/material'

const ErrorAlert = ({ content }: { content: ReactNode }) => (
  <Alert
    className="flex w-fit items-center border-0 bg-[#FAECD1] text-[#291B00]"
    severity="error"
    icon={<MdErrorOutline color="#291B00" />}
  >
    {content}
  </Alert>
)

export default ErrorAlert
