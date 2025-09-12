import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { tableColumns } from '../../constants'
import { useStore } from '@ors/store'

import { FiEdit } from 'react-icons/fi'
import { find, map } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.country)?.name

  const getAgencyNames = (params: ValueGetterParams | ITooltipParams) =>
    map(
      params.data.agencies,
      (crtAgency) => find(agencies, (agency) => agency.id === crtAgency)?.name,
    ).join(', ')

  return {
    columnDefs: [
      {
        minWidth: 30,
        maxWidth: 30,
        resizable: false,
        sortable: false,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center p-2">
            {canEditEnterprise && props.data.status !== 'Obsolete' && (
              <Link
                className="flex h-4 w-4 justify-center"
                href={`/projects-listing/enterprises/${props.data.id}/edit`}
              >
                <FiEdit size={16} />
              </Link>
            )}
          </div>
        ),
      },
      {
        headerName: tableColumns.code,
        field: 'code',
        tooltipField: 'code',
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/enterprises/${props.data.id}`}
            >
              <span>{props.value}</span>
            </Link>
          </div>
        ),
      },
      {
        headerName: tableColumns.name,
        field: 'name',
        tooltipField: 'name',
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
        headerName: tableColumns.country,
        field: 'country__name',
        valueGetter: (params: ValueGetterParams) => getCountryName(params),
        tooltipValueGetter: (params: ITooltipParams) => getCountryName(params),
      },
      {
        headerName: tableColumns.location,
        field: 'location',
        tooltipField: 'location',
      },
      {
        headerName: tableColumns.application,
        field: 'application',
        tooltipField: 'application',
      },
      {
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
      {
        headerName: 'Project',
        field: 'project_code',
        tooltipField: 'project_code',
        sortable: false,
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
