import { Button, Skeleton, Typography } from '@mui/material'

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
    field: 'status',
    flex: 1,
    headerName: 'Status',
    minWidth: 100,
  },
  {
    cellClass: 'text-center',
    cellRenderer: (props: any) => {
      return (
        <Typography>
          {props.data.isSkeleton ? (
            <Skeleton />
          ) : (
            <Button variant="text">Edit</Button>
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
