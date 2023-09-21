import { Skeleton, Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'

export const columnSchema = [
  {
    cellRenderer: (props: any) => {
      return (
        <Typography component="span">
          {props.data.isSkeleton ? (
            <Skeleton />
          ) : (
            <Link
              className="no-underline"
              href={`/country-programme/${props.data.id}`}
            >
              {props.data.name}
            </Link>
          )}
        </Typography>
      )
    },
    field: 'name',
    flex: 1,
    headerName: 'Report name',
    minWidth: 200,
  },
  {
    field: 'country',
    flex: 1,
    headerName: 'Country',
    minWidth: 140,
  },
  {
    field: 'year',
    flex: 1,
    headerName: 'Period',
    minWidth: 100,
  },
]
