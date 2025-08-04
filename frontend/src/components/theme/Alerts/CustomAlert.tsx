import { ReactNode } from 'react'

import { IoInformationCircleOutline } from 'react-icons/io5'
import { IoMdCheckmarkCircleOutline } from 'react-icons/io'
import { MdErrorOutline } from 'react-icons/md'
import { Alert } from '@mui/material'
import cx from 'classnames'

type AlertType = 'info' | 'success' | 'error'

const CustomAlert = ({
  type,
  content,
  alertClassName,
}: {
  type: AlertType
  content: ReactNode
  alertClassName?: string
}) => {
  const alertTypes = {
    info: {
      severity: 'info',
      className: 'bg-mlfs-bannerColor text-primary',
      icon: <IoInformationCircleOutline color="#002A3C" />,
    },
    success: {
      severity: 'success',
      className: 'bg-[#F9FCCF] text-[#373C00]',
      icon: <IoMdCheckmarkCircleOutline color="#373C00" />,
    },
    error: {
      severity: 'error',
      className: 'bg-[#FAECD1] text-[#291B00]',
      icon: <MdErrorOutline color="#291B00" />,
    },
  }
  const { severity, className, icon } = alertTypes[type]

  return (
    <Alert
      className={cx('flex w-fit border-0', className, alertClassName)}
      severity={severity as AlertType}
      icon={icon}
    >
      {content}
    </Alert>
  )
}

export default CustomAlert
