import Link from '@ors/components/ui/Link/Link'
import { tableColumns } from '../constants'
import { formatNumberColumns } from '../utils'

import { Checkbox } from '@mui/material'
import { FiEdit, FiEye } from 'react-icons/fi'
import { isNil } from 'lodash'
import {
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'

const getColumnDefs = (
  user_permissions: string[],
  projectId?: number | null,
  setProjectId?: (id: number | null) => void,
) => {
  return {
    columnDefs: [
      ...(user_permissions.includes('view_project') ||
      user_permissions.includes('edit_project')
        ? [
            {
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center justify-center gap-1.5">
                  {user_permissions.includes('view_project') && (
                    <Link
                      className="flex justify-center"
                      href={`/projects-listing/${props.data.id}`}
                    >
                      <FiEye size={16} />
                    </Link>
                  )}
                  {user_permissions.includes('view_project') &&
                    user_permissions.includes('edit_project') && <span>/</span>}
                  {user_permissions.includes('edit_project') && (
                    <Link
                      className="flex justify-center"
                      href={`/projects-listing/${props.data.id}/edit`}
                    >
                      <FiEdit size={16} />
                    </Link>
                  )}
                </div>
              ),
              field: '',
              minWidth: 70,
              maxWidth: 70,
              sortable: false,
            },
          ]
        : []),
      ...(projectId !== undefined && setProjectId
        ? [
            {
              headerName: 'Select',
              field: '',
              cellClass: 'ag-text-center',
              minWidth: 90,
              maxWidth: 90,
              sortable: false,
              cellRenderer: (props: ICellRendererParams) => (
                <Checkbox
                  checked={projectId == props.data.id}
                  onChange={(event) => {
                    setProjectId(event.target.checked ? props.data.id : null)
                  }}
                  sx={{
                    color: 'black',
                  }}
                />
              ),
            },
          ]
        : []),
      {
        headerName: tableColumns.submission_status,
        field: 'submission_status',
        tooltipField: 'submission_status',
      },
      {
        headerName: tableColumns.status,
        field: 'status',
        tooltipField: 'status',
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 120,
      },
      {
        headerName: tableColumns.country,
        field: 'country',
        tooltipField: 'country',
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 150,
      },
      {
        headerName: tableColumns.metacode,
        field: 'metaproject_code',
        tooltipField: 'metaproject_code',
      },
      {
        headerName: tableColumns.code,
        field: 'code',
        tooltipField: 'code',
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 120,
      },
      {
        headerName: tableColumns.cluster,
        field: 'cluster.code',
        tooltipField: 'cluster.name',
      },
      {
        headerName: tableColumns.tranche,
        field: 'tranche',
        tooltipField: 'tranche',
        minWidth: 70,
      },
      {
        headerName: tableColumns.agency,
        field: 'agency',
        tooltipField: 'agency',
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 110,
      },
      {
        headerName: tableColumns.title,
        field: 'title',
        tooltipField: 'title',
        cellClass: 'ag-cell-ellipsed',
        minWidth: 300,
        ...(user_permissions.includes('view_project') && {
          cellRenderer: (props: ICellRendererParams) => (
            <Link href={`/projects-listing/${props.data.id}`}>
              {props.value}
            </Link>
          ),
        }),
      },
      {
        headerName: tableColumns.type,
        field: 'project_type.code',
        tooltipField: 'project_type.name',
      },
      {
        headerName: tableColumns.sector,
        field: 'sector.code',
        tooltipField: 'sector.name',
      },
      {
        headerName: tableColumns.total_fund,
        field: 'total_fund',
        minWidth: 120,
        valueGetter: (params: ValueGetterParams) =>
          !isNil(params.data.total_fund)
            ? '$' + formatNumberColumns(params, 'total_fund')
            : '',
        tooltipValueGetter: (params: ITooltipParams) =>
          formatNumberColumns(params, 'total_fund', {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          }),
      },
    ],
    defaultColDef: {
      headerClass: 'ag-text-center',
      cellClass: 'ag-text-center ag-cell-ellipsed',
      minWidth: 90,
      resizable: true,
      sortable: true,
    },
  }
}

export default getColumnDefs
