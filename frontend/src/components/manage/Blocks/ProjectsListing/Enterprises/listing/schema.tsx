import Link from '@ors/components/ui/Link/Link'
import { EnterpriseEntityType } from '../../interfaces'
import { useStore } from '@ors/store'

import { find } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (enterprises: EnterpriseEntityType[], type: string) => {
  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.country)?.name

  const getEnterpriseName = (enterpriseId: number) =>
    find(enterprises, (enterprise) => enterprise.id === enterpriseId)?.code

  return {
    columnDefs: [
      {
        headerName: 'Code',
        field: 'code',
        tooltipField: 'code',
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={
                type === 'listing'
                  ? `/projects-listing/enterprises/${props.data.id}`
                  : `/projects-listing/projects-enterprises/${props.data.project_id}/view/${props.data.project_enterprise_id}`
              }
            >
              <span>{props.value}</span>
            </Link>
          </div>
        ),
      },
      {
        headerName: 'Name',
        field: 'name',
        tooltipField: 'name',
        cellClass: 'ag-cell-ellipsed !pl-2.5',
        minWidth: 150,
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
        headerName: 'Status',
        field: 'status',
        tooltipField: 'status',
        minWidth: 120,
      },
      {
        headerName: 'Project',
        field: 'project_code',
        tooltipField: 'project_code',
      },
      ...(type === 'listing'
        ? [
            {
              headerName: 'Current enterprise',
              field: 'approved_enterprise',
              minWidth: 150,
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center justify-center p-2">
                  <Link
                    className="overflow-hidden truncate whitespace-nowrap"
                    href={`/projects-listing/enterprises/${props.value}`}
                  >
                    <span>{getEnterpriseName(props.value)}</span>
                  </Link>
                </div>
              ),
              tooltipValueGetter: (props: ITooltipParams) =>
                getEnterpriseName(props.value),
            },
          ]
        : []),
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
