import { Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'

import { StatusPill } from '../StatusPill/StatusPill'

function ListItem(props: any) {
  const { item } = props

  const formattedDate = new Date(item.updated_at).toLocaleString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = new Date(item.updated_at).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <li
      key={item.id}
      className="rounded-lg p-4"
      style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
    >
      <Link
        className="flex flex-wrap items-center justify-between gap-1 text-2xl font-semibold text-typography"
        // href={`/business-plans/${item.name}/${item.year_start}-${item.year_end}/${lowerCase(item.status)}`}
        underline="none"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">{item.name}</span>
          <StatusPill status={item.status} />
        </div>
        <span className="text-lg font-normal tracking-tight">
          Modified on {formattedDate} {formattedTime} by {item.updated_by}
        </span>
      </Link>
    </li>
  )
}

function SimpleList(props: any) {
  const { list } = props

  return list && list.length > 0 ? (
    <ul className="flex list-none flex-col gap-4 pl-0">
      {list.map((item: any) => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  ) : (
    <Typography component="h1" variant="h5">
      No data available.
    </Typography>
  )
}

export default SimpleList
