import { Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'
import StatusPill from '@ors/components/ui/StatusPill/StatusPill'

function SimpleList(props: any) {
  const { list } = props

  // Mock user and random date
  const mockUser = 'John Smith'
  const randomDate = 'June 15, 2024 12:53'

  return list && list.length > 0 ? (
    <ul className="flex flex-col gap-4 pl-0">
      {list.map((item: any) => {
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between border-0 border-b border-solid border-secondary pb-4"
          >
            <Link
              className="flex items-center gap-2 text-2xl font-semibold text-typography"
              href={`/business-plans/${item.agency.name}/${item.year_start}/${item.year_end}`}
              underline="none"
            >
              <span>
                {item.agency.name} {item.year_start} - {item.year_end}
              </span>
              <StatusPill status={item.status} />
            </Link>
            <span className="font-normal tracking-tight">
              Modified on {randomDate} by {mockUser}
            </span>
          </li>
        )
      })}
    </ul>
  ) : (
    <Typography component="h1" variant="h5">
      No data available for the selected filters.
    </Typography>
  )
}

export default SimpleList
