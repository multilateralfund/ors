import { Skeleton, Typography } from '@mui/material'

import Link from '@ors/components/ui/Link'

export const columnSchema = [
  {
    field: 'title',
    flex: 2,
    headerName: 'Project title/code',
    minWidth: 300,
  },
  {
    field: 'country',
    flex: 1,
    headerName: 'Country',
    minWidth: 140,
  },
  {
    field: 'agency',
    flex: 1,
    headerName: 'Agency',
    minWidth: 100,
  },
  {
    field: 'status',
    flex: 1,
    headerName: 'Status',
    minWidth: 100,
  },
  {
    field: 'sector',
    flex: 1,
    headerName: 'Sector',
    minWidth: 100,
  },
  {
    field: 'subsector',
    flex: 1,
    headerName: 'Subsector',
    minWidth: 200,
  },
  {
    field: 'project_type',
    flex: 1,
    headerName: 'Project Type',
    minWidth: 200,
  },
  {
    field: 'substance_type',
    flex: 1,
    headerName: 'Substance Type',
    minWidth: 200,
  },
  {
    field: 'approval_meeting_no',
    flex: 1,
    headerName: 'Approval meeting',
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
            <Link
              className="no-underline"
              href={`/submissions/${props.data.id}`}
            >
              View
            </Link>
          )}
        </Typography>
      )
    },
    field: 'action',
    headerClass: 'text-center',
    headerName: 'Action',
    minWidth: 100,
  },
]
