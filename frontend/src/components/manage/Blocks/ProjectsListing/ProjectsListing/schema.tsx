import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
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
  mode: string,
  projectId?: number | null,
  setProjectData?: (data: {
    projectId: number | null
    projectTitle: string
  }) => void,
  associationIds?: number[],
  setAssociationIds?: (data: number[]) => void,
) => {
  const {
    canViewProjects,
    canAssociateProjects,
    canUpdateProjects,
    canEditProjects,
  } = useContext(PermissionsContext)

  const getCellClass = (data: any) => {
    const projectTypeClass =
      data.isOnly !== false ? 'single-project' : 'multiple-projects'

    return cx('!pl-0 ag-text-center', projectTypeClass, {
      'first-project': data.isFirst,
    })
  }

  return {
    columnDefs: [
      ...(mode === 'association' && associationIds
        ? [
            {
              minWidth: 40,
              maxWidth: 40,
              cellClass: (props: CellClassParams) =>
                `!pl-0 ag-text-center ${getCellClass(props.data)}`,
              cellRenderer: (props: ICellRendererParams) =>
                props.data.isFirst !== false && (
                  <Checkbox
                    checked={
                      setAssociationIds
                        ? associationIds.includes(props.data.id)
                        : true
                    }
                    onChange={(event) => {
                      if (setAssociationIds) {
                        setAssociationIds(
                          event.target.checked
                            ? [...associationIds, props.data.id]
                            : filter(
                                associationIds,
                                (id) => id !== props.data.id,
                              ),
                        )
                      }
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
        tooltipField: 'title',
        minWidth:
          mode === 'association' && !associationIds && !setAssociationIds
            ? 342
            : 300,
        cellClass: (props: CellClassParams) =>
          'ag-cell-ellipsed ' +
          (mode === 'association-listing' ? getCellClass(props.data) : ''),
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center gap-1 p-2">
            {mode !== 'association' && (
              <>
                {canEditProjects && props.data.editable ? (
                  <Link
                    className="flex h-4 w-4 justify-center"
                    href={`/projects-listing/${props.data.id}/edit`}
                  >
                    <FiEdit size={16} />
                  </Link>
                ) : (
                  mode !== 'association-listing' && (
                    <div className="w-4 min-w-4" />
                  )
                )}
                {projectId !== undefined &&
                  setProjectData &&
                  (canAssociateProjects || canUpdateProjects) && (
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
                  'no-underline': !canViewProjects,
                },
                {
                  '!ml-12':
                    mode === 'association' &&
                    !associationIds &&
                    !setAssociationIds,
                },
              )}
              href={
                canViewProjects ? `/projects-listing/${props.data.id}` : null
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
      sortable: mode === 'listing',
    },
  }
}

export default getColumnDefs
