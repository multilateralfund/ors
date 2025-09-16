import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { tableColumns } from '../../constants'
import { useStore } from '@ors/store'

import { FiEdit } from 'react-icons/fi'
import { find, map } from 'lodash'
import { useParams } from 'wouter'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (type: string) => {
  const { project_id } = useParams<Record<string, string>>()

  const {
    canEditEnterprise,
    canEditProjectEnterprise,
    canApproveEnterprise,
    canApproveProjectEnterprise,
  } = useContext(PermissionsContext)

  const { countries, agencies } = useStore((state) => ({
    countries: state.common.countries.data,
    agencies: state.common.agencies.data,
  }))

  const isEnterprise = type === 'enterprise'

  const canAccessEditPage = isEnterprise
    ? canEditEnterprise || canApproveEnterprise
    : canEditProjectEnterprise || canApproveProjectEnterprise
  const approvalPermissions = isEnterprise
    ? canApproveEnterprise
    : canApproveProjectEnterprise

  const getViewUrl = (enterpriseId: number, project_id: number) =>
    isEnterprise
      ? `/projects-listing/enterprises/${enterpriseId}`
      : `/projects-listing/projects-enterprises/${project_id}/view/${enterpriseId}`

  const getEditUrl = (enterpriseId: number) =>
    isEnterprise
      ? `/projects-listing/enterprises/${enterpriseId}/edit`
      : `/projects-listing/projects-enterprises/${project_id}/edit/${enterpriseId}`

  const getCountryName = (params: ValueGetterParams | ITooltipParams) => {
    const crtCountry = isEnterprise
      ? params.data.country
      : params.data.enterprise?.country

    return find(countries, (country) => country.id === crtCountry)?.name
  }

  const getAgencyNames = (params: ValueGetterParams | ITooltipParams) => {
    const crtAgencies = isEnterprise
      ? params.data.agencies
      : params.data.enterprise?.agencies

    return map(
      crtAgencies,
      (crtAgency) => find(agencies, (agency) => agency.id === crtAgency)?.name,
    ).join(', ')
  }

  return {
    columnDefs: [
      ...(canAccessEditPage && (project_id || isEnterprise)
        ? [
            {
              minWidth: 40,
              maxWidth: 40,
              resizable: false,
              sortable: false,
              cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-no-border-r',
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center p-2">
                  {props.data.status !== 'Obsolete' &&
                    !(
                      props.data.status === 'Approved' && !approvalPermissions
                    ) && (
                      <Link
                        className="flex h-4 w-4 justify-center"
                        href={getEditUrl(props.data.id)}
                      >
                        <FiEdit size={16} />
                      </Link>
                    )}
                </div>
              ),
            },
          ]
        : []),
      {
        headerName: tableColumns.code,
        field: isEnterprise ? 'code' : 'enterprise.code',
        tooltipField: isEnterprise ? 'code' : 'enterprise.code',
        minWidth: 100,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={getViewUrl(props.data.id, props.data.project)}
            >
              <span>{props.value}</span>
            </Link>
          </div>
        ),
      },
      {
        headerName: tableColumns.name,
        field: isEnterprise ? 'name' : 'enterprise.name',
        tooltipField: isEnterprise ? 'name' : 'enterprise.name',
        cellClass: 'ag-cell-ellipsed !pl-2.5',
        minWidth: 200,
      },
      {
        headerName: tableColumns.agencies,
        valueGetter: (params: ValueGetterParams) => getAgencyNames(params),
        tooltipValueGetter: (params: ITooltipParams) => getAgencyNames(params),
        sortable: false,
        minWidth: 200,
      },
      {
        headerName: tableColumns.country,
        field: isEnterprise ? 'country__name' : 'enterprise.country__name',
        valueGetter: (params: ValueGetterParams) => getCountryName(params),
        tooltipValueGetter: (params: ITooltipParams) => getCountryName(params),
      },
      {
        headerName: tableColumns.location,
        field: isEnterprise ? 'location' : 'enterprise.location',
        tooltipField: isEnterprise ? 'location' : 'enterprise.location',
      },
      {
        headerName: tableColumns.application,
        field: isEnterprise ? 'application' : 'enterprise.application',
        tooltipField: isEnterprise ? 'application' : 'enterprise.application',
      },
      {
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
      ...(!project_id && !isEnterprise
        ? [
            {
              headerName: 'Project',
              field: 'project_code',
              tooltipField: 'project_code',
              sortable: false,
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center justify-center p-2">
                  <Link
                    className="overflow-hidden truncate whitespace-nowrap"
                    href={`/projects-listing/${props.data.project}`}
                  >
                    <span>{props.value}</span>
                  </Link>
                </div>
              ),
            },
          ]
        : []),
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
