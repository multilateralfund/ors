import { Skeleton, Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'

export const columnSchema = [
  {
    field: 'name',
    headerName: 'Report name',
    minWidth: 200,
  },
  {
    field: 'country',
    headerName: 'Country',
    minWidth: 140,
  },
  {
    field: 'year',
    headerName: 'Period',
    minWidth: 100,
  },
  {
    cellClass: 'text-center',
    cellRenderer: (props: any) => {
      return (
        <Typography component="span">
          {props.data.isSkeleton ? (
            <Skeleton />
          ) : (
            <Link className="no-underline" href={`/reports/${props.data.id}`}>
              Edit
            </Link>
          )}
        </Typography>
      )
    },
    field: 'action',
    headerClass: 'text-center',
    headerName: 'Action',
    minWidth: 100,
    sortable: false,
  },
]
