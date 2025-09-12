import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { useStore } from '@ors/store'

import { FiEdit } from 'react-icons/fi'
import { find, map } from 'lodash'
import { useParams } from 'wouter'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = () => {
  const { project_id } = useParams<Record<string, string>>()

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data

  const { canEditProjectEnterprise } = useContext(PermissionsContext)

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.enterprise?.country)
      ?.name

  const getAgencyNames = (params: ValueGetterParams | ITooltipParams) =>
    map(
      params.data.enterprise?.agencies,
      (crtAgency) => find(agencies, (agency) => agency.id === crtAgency)?.name,
    ).join(', ')

  return {
    columnDefs: [
      ...(project_id
        ? [
            {
              minWidth: 40,
              maxWidth: 40,
              sortable: false,
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center p-2">
                  {canEditProjectEnterprise &&
                    props.data.status !== 'Obsolete' && (
                      <Link
                        className="flex h-4 w-4 justify-center"
                        href={`/projects-listing/projects-enterprises/${project_id}/edit/${props.data.id}`}
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
        headerName: 'Code',
        field: 'enterprise.code',
        tooltipField: 'enterprise.code',
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/projects-enterprises/${props.data.project}/view/${props.data.id}`}
            >
              <span>{props.value}</span>
            </Link>
          </div>
        ),
      },
      {
        headerName: 'Name',
        field: 'enterprise.name',
        tooltipField: 'enterprise.name',
        cellClass: 'ag-cell-ellipsed !pl-2.5',
        minWidth: 150,
      },
      {
        headerName: 'Agency(ies)',
        valueGetter: (params: ValueGetterParams) => getAgencyNames(params),
        tooltipValueGetter: (params: ITooltipParams) => getAgencyNames(params),
        sortable: false,
      },
      {
        headerName: 'Country',
        field: 'enterprise.country__name',
        valueGetter: (params: ValueGetterParams) => getCountryName(params),
        tooltipValueGetter: (params: ITooltipParams) => getCountryName(params),
      },
      {
        headerName: 'Location',
        field: 'enterprise.location',
        tooltipField: 'enterprise.location',
      },
      {
        headerName: 'Application',
        field: 'enterprise.application',
        tooltipField: 'enterprise.application',
      },
      {
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
      ...(!project_id
        ? [
            {
              headerName: 'Project',
              field: 'project_code',
              tooltipField: 'project_code',
            },
          ]
        : []),
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
