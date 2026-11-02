import { Fragment, useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { SectionTitle } from './ViewHelperComponents'
import { PCRHistoryItem } from '../../interfaces'

import { FaLock, FaLockOpen } from 'react-icons/fa6'
import { Divider } from '@mui/material'
import { map } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'

const HistoryItem = ({ item }: { item: PCRHistoryItem }) => {
  const { first_name, last_name, username, email } = item.user
  const fullName = [first_name, last_name].filter(Boolean).join(' ') || username

  const creationDate = dayjs(item.created_at).format('MMMM DD, YYYY at h:mm A')

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-pretty py-3 pr-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="my-1 text-sm text-gray-500">{creationDate}</p>
        <p className="my-1 whitespace-pre-line font-medium text-gray-900">
          {item.description}
        </p>
        {item.lock_action && (
          <span
            className={cx(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-base font-medium',
              item.lock_action === 'Locked'
                ? 'bg-rose-50 text-rose-800'
                : 'bg-green-50 text-green-700',
            )}
          >
            {item.lock_action === 'Locked' ? <FaLock /> : <FaLockOpen />}
            {item.lock_action}
          </span>
        )}
      </div>
      <p className="my-1 rounded bg-gray-100 px-1 text-sm text-gray-500">
        {fullName} - {email} ({username})
      </p>
    </div>
  )
}

const PCRHistory = () => {
  const { pcr } = useContext(PCRDataContext)
  const historyItems = pcr.data?.history

  return (
    <>
      <SectionTitle>History</SectionTitle>
      {map(historyItems, (item, index) => (
        <Fragment key={index}>
          <HistoryItem item={item} />
          <Divider className="w-[98%]" />
        </Fragment>
      ))}
    </>
  )
}

export default PCRHistory
