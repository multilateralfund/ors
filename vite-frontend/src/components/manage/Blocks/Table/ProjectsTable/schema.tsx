import { Skeleton, Typography } from '@mui/material'

import Link from '@ors/components/ui/Link/Link'

export const columnSchema = [
  {
    field: 'title',
    headerName: 'Project title/code',
    minWidth: 300,
  },
  {
    field: 'country',
    headerName: 'Country',
    minWidth: 140,
  },
  {
    field: 'agency',
    headerName: 'Agency',
    minWidth: 100,
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 100,
  },
  {
    field: 'sector',
    headerName: 'Sector',
    minWidth: 100,
  },
  {
    field: 'subsector',
    headerName: 'Subsector',
    minWidth: 200,
  },
  {
    field: 'project_type',
    headerName: 'Project Type',
    minWidth: 200,
  },
  {
    field: 'substance_type',
    headerName: 'Substance Type',
    minWidth: 200,
  },
  {
    field: 'approval_meeting_no',
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
            <Link className="no-underline" href={`/projects/${props.data.id}`}>
              View
            </Link>
          )}
        </Typography>
      )
    },
    field: 'action',
    headerClass: 'ag-text-center',
    headerName: 'Action',
    minWidth: 100,
  },
]
