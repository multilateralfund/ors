import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import React from 'react'
import dayjs from 'dayjs'
import { FaClockRotateLeft } from 'react-icons/fa6'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader.tsx'

type ProjectHistoryProps = {
  project: ProjectTypeApi
  mode: string
}

const HistoryItem = ({ item }: { item: ProjectTypeApi['history'][0] }) => {
  let fullName = item.user.username
  if (item.user.first_name && item.user.last_name) {
    fullName = `${item.user.first_name} ${item.user.last_name}`
  } else if (item.user.first_name) {
    fullName = item.user.first_name
  } else if (item.user.last_name) {
    fullName = item.user.last_name
  }

  const description = item.description
  const formattedDateTime = dayjs(item.created_at).format(
    'MMMM DD, YYYY at h:mm A',
  )

  // <li>
  //   {fullName} ({item.user.email}) - {item.description} {item.created_at}
  // </li>

  return (
    <div className="flex grow items-center justify-between gap-3 text-pretty px-4 py-3 pl-0">
      <div className="flex items-center gap-2">
        <p
          id={`report_date`}
          className="my-1 min-w-24 text-sm font-normal text-gray-500"
        >
          {formattedDateTime}
        </p>
        <p
          id={`report_summary`}
          className="text-md my-1 font-medium text-gray-900"
        >
          {description}
        </p>
      </div>
      <div>
        <p
          id="reporting_officer"
          className="my-1 w-fit rounded bg-gray-100 px-1 text-sm font-normal text-gray-500"
        >
          {fullName} - {item.user.email} ({item.user.username})
        </p>
      </div>
    </div>
  )
}

const ProjectHistory = ({ project, mode }: ProjectHistoryProps) => {
  const historyItems = project.history

  const renderCollection = (items: typeof historyItems) => {
    return items.map((item, index) => (
      <div key={index}>
        <HistoryItem key={item.created_at} item={item} />{' '}
        <hr className={'mx-0 my-0 h-px !w-[98%] border-0 bg-gray-200'} />
      </div>
    ))
  }

  const renderedHistory = renderCollection(historyItems)

  return (
    <div>
      <HeaderWithIcon title="History" Icon={FaClockRotateLeft} />
      <hr className="mx-0 mb-4 mt-7 h-px border-0 bg-gray-200" />
      <div className="">{renderedHistory}</div>
    </div>
  )
}

export default ProjectHistory
