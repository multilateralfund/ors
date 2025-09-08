import Link from '@ors/components/ui/Link/Link'
import { EnterpriseOverview } from '../../interfaces'
import { useStore } from '@ors/store'

import { find } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (
  enterprises: (EnterpriseOverview & { id: number })[],
) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.country)?.name

  const getEnterpriseName = (enterpriseId: number) =>
    find(enterprises, (enterprise) => enterprise.id === enterpriseId)?.name

  return {
    columnDefs: [
      {
        headerName: 'Code',
        field: 'code',
        tooltipField: 'code',
      },
      {
        headerName: 'Name',
        field: 'name',
        tooltipField: 'name',
        minWidth: 150,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center p-2">
            <Link
              className="ml-2 overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/enterprises/${props.data.id}`}
            >
              {props.value}
            </Link>
          </div>
        ),
      },
      {
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
      {
        headerName: 'Country',
        valueGetter: (params: ValueGetterParams) => getCountryName(params),
        tooltipValueGetter: (params: ITooltipParams) => getCountryName(params),
      },
      {
        headerName: 'Location',
        field: 'location',
        tooltipField: 'location',
      },
      {
        headerName: 'Application',
        field: 'application',
        tooltipField: 'application',
      },
      {
        headerName: 'Current enterprise',
        field: 'approved_enterprise',
        minWidth: 150,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center p-2">
            <Link
              className="ml-2 overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/enterprises/${props.data.approved_enterprise}`}
            >
              {getEnterpriseName(props.value)}
            </Link>
          </div>
        ),
        tooltipValueGetter: (props: ITooltipParams) =>
          getEnterpriseName(props.value),
      },
    ],
    defaultColDef: {
      headerClass: 'ag-text-center',
      cellClass: 'ag-text-center ag-cell-ellipsed',
      minWidth: 90,
      resizable: true,
      sortable: false,
    },
  }
}

export default getColumnDefs
