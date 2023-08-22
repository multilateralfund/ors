import { Skeleton, Typography } from '@mui/material'

import Link from '@ors/components/ui/Link'

export const columnSchema = [
  {
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
    flex: 1,
    headerClass: 'text-center',
    headerName: 'Action',
    minWidth: 100,
    sortable: false,
  },
]
