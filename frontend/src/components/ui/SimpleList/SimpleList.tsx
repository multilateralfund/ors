import { Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'
import StatusPill from '@ors/components/ui/StatusPill/StatusPill'

function ListItem(props: any) {
  const { item } = props

  // Mock user and random date
  const mockUser = 'John Smith'
  const randomDate = 'June 15, 2024 12:53'

  return (
    <li
      key={item.id}
      className="rounded-lg p-4"
      style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
    >
      <Link
        className="flex items-center justify-between flex-wrap gap-1 text-2xl font-semibold text-typography"
        href={`/business-plans/${item.agency.name}/${item.year_start}/${item.year_end}`}
        underline="none"
      >
        <div className="flex items-center gap-2">
          <span>
            {item.agency.name} {item.year_start} - {item.year_end}
          </span>
          <StatusPill status={item.status} />
        </div>
        <span className="font-normal tracking-tight">
          Modified on {randomDate} by {mockUser}
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
