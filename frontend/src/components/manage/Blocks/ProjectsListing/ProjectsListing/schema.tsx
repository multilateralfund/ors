import Link from '@ors/components/ui/Link/Link'
import { tableColumns } from '../constants'
import { formatNumberColumns } from '../utils'

import { Checkbox } from '@mui/material'
import { FiEdit } from 'react-icons/fi'
import { isNil } from 'lodash'
import {
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'
import cx from 'classnames'

const getColumnDefs = (
  user_permissions: string[],
  projectId?: number | null,
  setProjectData?: (data: {
    projectId: number | null
    projectTitle: string
  }) => void,
) => {
  const canViewProject = user_permissions.includes('view_project')

  return {
    columnDefs: [
      {
        headerName: tableColumns.title,
        field: 'title',
        tooltipField: 'title',
        cellClass: 'ag-cell-ellipsed',
        minWidth: 300,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center gap-1 p-2">
            {user_permissions.includes('edit_project') && (
              <Link
                className="flex h-4 w-4 justify-center"
                href={`/projects-listing/${props.data.id}/edit`}
              >
                <FiEdit size={16} />
              </Link>
            )}
            {projectId !== undefined && setProjectData && (
              <Checkbox
                checked={projectId == props.data.id}
                onChange={(event) => {
                  setProjectData(
                    event.target.checked
                      ? {
                          projectId: props.data.id,
                          projectTitle: props.data.title,
                        }
                      : { projectId: null, projectTitle: '' },
                  )
                }}
                sx={{
                  color: 'black',
                }}
              />
            )}
            <Link
              className={cx('ml-2 overflow-hidden truncate whitespace-nowrap', {
                'no-underline': !canViewProject,
              })}
              href={
                canViewProject ? `/projects-listing/${props.data.id}` : null
              }
            >
              {props.value}
            </Link>
          </div>
        ),
      },
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
