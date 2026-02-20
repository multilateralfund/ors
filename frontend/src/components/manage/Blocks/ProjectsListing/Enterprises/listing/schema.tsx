import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { enterpriseFieldsMapping } from '../../ProjectsEnterprises/constants'
import { formatNumberColumns } from '../../utils'

import { IoTrash } from 'react-icons/io5'
import { FiEdit } from 'react-icons/fi'
import { find, isNil } from 'lodash'
import { useParams } from 'wouter'
import dayjs from 'dayjs'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (setIdToDelete?: (idToDelete: number | null) => void) => {
  const { project_id } = useParams<Record<string, string>>()

  const {
    canEditEnterprise,
    canEditProjectEnterprise,
    canApproveEnterprise,
    canApproveProjectEnterprise,
  } = useContext(PermissionsContext)

  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)

  const isEnterprise = !project_id
  const editPermissions = isEnterprise
    ? canEditEnterprise
    : canEditProjectEnterprise
  const approvalPermissions = isEnterprise
    ? canApproveEnterprise
    : canApproveProjectEnterprise
  const canAccessEditPage = editPermissions || approvalPermissions

  const checkboxWidth = isEnterprise || !canEditProjectEnterprise ? 40 : 80

  const getViewUrl = (enterpriseId: number) =>
    isEnterprise
      ? `/projects-listing/enterprises/${enterpriseId}`
      : `/projects-listing/projects-enterprises/${project_id}/view/${enterpriseId}`

  const getEditUrl = (enterpriseId: number) =>
    isEnterprise
      ? `/projects-listing/enterprises/${enterpriseId}/edit`
      : `/projects-listing/projects-enterprises/${project_id}/edit/${enterpriseId}`

  const getFieldValue = (
    params: ValueGetterParams | ITooltipParams,
    data: any,
    field: string,
    isDirectField?: boolean,
  ) => {
    const crtEntry =
      isEnterprise || isDirectField
        ? params.data[field]
        : params.data.enterprise?.[field]

    return find(data, (entry) => entry.id === crtEntry)?.name
  }

  const getFieldName = (field: string) =>
    isEnterprise ? field : 'enterprise.' + field

  const getDecimalValue = (
    params: ValueGetterParams | ITooltipParams,
    field: string,
  ) => {
    const crtField = getFieldName(field)

    return !isNil(params.data[crtField])
      ? formatNumberColumns(params, crtField)
      : ''
  }

  return {
    columnDefs: [
      ...(canAccessEditPage
        ? [
            {
              minWidth: checkboxWidth,
              maxWidth: checkboxWidth,
              resizable: false,
              sortable: false,
              cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-no-border-r',
              cellRenderer: (props: ICellRendererParams) => {
                const canDeleteProjectEnterprise =
                  !isEnterprise &&
                  setIdToDelete &&
                  canEditProjectEnterprise &&
                  (props.data.status !== 'Approved' ||
                    canApproveProjectEnterprise)

                return (
                  <div className="flex items-center gap-1 p-2">
                    {props.data.status !== 'Obsolete' &&
                      (isEnterprise ||
                        props.data.status !== 'Approved' ||
                        (canEditProjectEnterprise &&
                          canApproveProjectEnterprise)) && (
                        <>
                          <Link
                            className="flex h-4 w-4 justify-center"
                            href={getEditUrl(props.data.id)}
                          >
                            <FiEdit size={16} />
                          </Link>
                          {canDeleteProjectEnterprise && '/'}
                        </>
                      )}
                    {canDeleteProjectEnterprise && (
                      <IoTrash
                        size={18}
                        className="cursor-pointer fill-gray-500"
                        onClick={() => {
                          setIdToDelete(props.data.id)
                        }}
                      />
                    )}
                  </div>
                )
              },
            },
          ]
        : []),
      {
        headerName: enterpriseFieldsMapping.code,
        field: getFieldName('code'),
        tooltipField: getFieldName('code'),
        minWidth: 100,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={getViewUrl(props.data.id)}
            >
              <span>{props.value}</span>
            </Link>
          </div>
        ),
      },
      {
        headerName: enterpriseFieldsMapping.name,
        field: getFieldName('name'),
        tooltipField: getFieldName('name'),
        cellClass: 'ag-cell-ellipsed !pl-2.5',
        minWidth: 200,
      },
      ...(isEnterprise
        ? [
            {
              headerName: enterpriseFieldsMapping.country,
              field: getFieldName('country__name'),
              valueGetter: (params: ValueGetterParams) =>
                getFieldValue(params, countries, 'country'),
              tooltipValueGetter: (params: ITooltipParams) =>
                getFieldValue(params, countries, 'country'),
            },
          ]
        : [
            {
              headerName: enterpriseFieldsMapping.agency,
              field: 'agency__name',
              valueGetter: (params: ValueGetterParams) =>
                getFieldValue(params, agencies, 'agency', true),
              tooltipValueGetter: (params: ITooltipParams) =>
                getFieldValue(params, agencies, 'agency', true),
            },
            {
              headerName: enterpriseFieldsMapping.project_type,
              field: 'project_type',
              valueGetter: (params: ValueGetterParams) =>
                getFieldValue(params, project_types, 'project_type', true),
              tooltipValueGetter: (params: ITooltipParams) =>
                getFieldValue(params, project_types, 'project_type', true),
            },
          ]),
      {
        headerName: enterpriseFieldsMapping.location,
        field: getFieldName('location'),
        tooltipField: getFieldName('location'),
      },
      {
        headerName: enterpriseFieldsMapping.stage,
        field: getFieldName('stage'),
        tooltipField: getFieldName('stage'),
      },
      {
        headerName: enterpriseFieldsMapping.sector,
        field: getFieldName('sector'),
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, sectors, 'sector'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, sectors, 'sector'),
      },
      {
        headerName: enterpriseFieldsMapping.subsector,
        field: getFieldName('subsector'),
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, subsectors, 'subsector'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, subsectors, 'subsector'),
      },
      {
        headerName: enterpriseFieldsMapping.application,
        field: getFieldName('application'),
        tooltipField: getFieldName('application'),
      },
      ...(isEnterprise
        ? [
            {
              headerName: enterpriseFieldsMapping.local_ownership,
              field: getFieldName('local_ownership'),
              valueGetter: (params: ValueGetterParams) =>
                getDecimalValue(params, 'local_ownership'),
              tooltipValueGetter: (params: ITooltipParams) =>
                getDecimalValue(params, 'local_ownership'),
            },
            {
              headerName: enterpriseFieldsMapping.export_to_non_a5,
              field: getFieldName('export_to_non_a5'),
              valueGetter: (params: ValueGetterParams) =>
                getDecimalValue(params, 'export_to_non_a5'),
              tooltipValueGetter: (params: ITooltipParams) =>
                getDecimalValue(params, 'export_to_non_a5'),
            },
            //  {
            //   headerName: enterpriseFieldsMapping.revision,
            //   field: getFieldName('revision'),
            //   tooltipField: getFieldName('revision'),
            // },
            {
              headerName: enterpriseFieldsMapping.date_of_revision,
              field: getFieldName('date_of_revision'),
              valueGetter: (params: ValueGetterParams) => {
                const value = params.data[getFieldName('date_of_revision')]
                return value ? dayjs(value).format('DD/MM/YYYY') : ''
              },
              tooltipValueGetter: (params: ITooltipParams) => {
                const value = params.data[getFieldName('date_of_revision')]
                return value ? dayjs(value).format('DD/MM/YYYY') : ''
              },
            },
          ]
        : []),
      {
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
    ],
    defaultColDef: {
      headerClass: 'ag-text-center',
      cellClass: 'ag-text-center ag-cell-ellipsed',
      minWidth: 150,
      resizable: true,
      sortable: true,
    },
  }
}

export default getColumnDefs
