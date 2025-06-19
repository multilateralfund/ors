import Link from '@ors/components/ui/Link/Link'
import { tableColumns } from '../constants'
import { formatNumberColumns } from '../utils'

import { Checkbox } from '@mui/material'
import { FiEdit } from 'react-icons/fi'
import { filter, isNil } from 'lodash'
import {
  CellClassParams,
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'
import cx from 'classnames'

const getColumnDefs = (
  user_permissions: string[],
  mode: string,
  projectId?: number | null,
  setProjectData?: (data: {
    projectId: number | null
    projectTitle: string
  }) => void,
  associationIds?: number[],
  setAssociationIds?: (data: number[]) => void,
) => {
  const canViewProject = user_permissions.includes('view_project')

  return {
    columnDefs: [
      ...(mode === 'association' && associationIds && setAssociationIds
        ? [
            {
              minWidth: 40,
              maxWidth: 40,
              cellClass: (props: CellClassParams) =>
                `ag-text-center ${
                  props.data.isOnly ? 'single-project' : 'multiple-projects'
                } ${props.data.isFirst ? 'first-project' : ''}`,
              cellRenderer: (props: ICellRendererParams) =>
                props.data.isFirst && (
                  <Checkbox
                    checked={associationIds.includes(props.data.id)}
                    onChange={(event) => {
                      setAssociationIds(
                        event.target.checked
                          ? [...associationIds, props.data.id]
                          : filter(
                              associationIds,
                              (id) => id !== props.data.id,
                            ),
                      )
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
        headerName: tableColumns.title,
        field: 'title',
        ...(mode === 'listing' && { tooltipField: 'title' }),
        cellClass: 'ag-cell-ellipsed',
        minWidth: 300,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center gap-1 p-2">
            {mode === 'listing' && (
              <>
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
              </>
            )}
            <Link
              className={cx(
                'ml-2 overflow-hidden truncate whitespace-nowrap',
                {
                  'no-underline': !canViewProject,
                },
                { '!ml-10': mode === 'association' && !setAssociationIds },
              )}
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
        ...(mode === 'listing' && { tooltipField: 'submission_status' }),
      },
      {
        headerName: tableColumns.status,
        field: 'status',
        ...(mode === 'listing' && { tooltipField: 'status' }),
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 120,
      },
      {
        headerName: tableColumns.country,
        field: 'country',
        ...(mode === 'listing' && { tooltipField: 'country' }),
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 150,
      },
      {
        headerName: tableColumns.metacode,
        field: 'metaproject_code',
        ...(mode === 'listing' && { tooltipField: 'metaproject_code' }),
      },
      {
        headerName: tableColumns.code,
        field: 'code',
        ...(mode === 'listing' && { tooltipField: 'code' }),
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 120,
      },
      {
        headerName: tableColumns.cluster,
        field: 'cluster.code',
        ...(mode === 'listing' && { tooltipField: 'cluster.name' }),
      },
      {
        headerName: tableColumns.tranche,
        field: 'tranche',
        ...(mode === 'listing' && { tooltipField: 'tranche' }),
        minWidth: 70,
      },
      {
        headerName: tableColumns.agency,
        field: 'agency',
        ...(mode === 'listing' && { tooltipField: 'agency' }),
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
        minWidth: 110,
      },
      {
        headerName: tableColumns.type,
        field: 'project_type.code',
        ...(mode === 'listing' && { tooltipField: 'project_type.name' }),
      },
      {
        headerName: tableColumns.sector,
        field: 'sector.code',
        ...(mode === 'listing' && { tooltipField: 'sector.name' }),
      },
      {
        headerName: tableColumns.total_fund,
        field: 'total_fund',
        minWidth: 120,
        valueGetter: (params: ValueGetterParams) =>
          !isNil(params.data.total_fund)
            ? '$' + formatNumberColumns(params, 'total_fund')
            : '',
        ...(mode === 'listing' && {
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'total_fund', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
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
