import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { EnterpriseType } from '../../interfaces'
import { useStore } from '@ors/store'

import { Checkbox } from '@mui/material'
import { useParams } from 'wouter'
import { find } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (
  projectEnterprises: EnterpriseType[],
  enterpriseId?: number | null,
  setEnterpriseId?: (enterpriseId: number | null) => void,
) => {
  const { project_id } = useParams<Record<string, string>>()

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const { canEditEnterprise } = useContext(PermissionsContext)

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.enterprise?.country)
      ?.name

  const getProjectEnterpriseName = (enterpriseId: number) =>
    find(projectEnterprises, (enterprise) => enterprise.id === enterpriseId)
      ?.enterprise?.code

  return {
    columnDefs: [
      ...(setEnterpriseId && canEditEnterprise
        ? [
            {
              headerName: 'Select',
              field: '',
              minWidth: 80,
              maxWidth: 80,
              sortable: false,
              cellClass: 'ag-text-center',
              cellRenderer: (params: ICellRendererParams) => (
                <Checkbox
                  checked={enterpriseId === params.data.id}
                  onChange={() => {
                    if (enterpriseId === params.data.id) {
                      setEnterpriseId(null)
                    } else {
                      setEnterpriseId(params.data.id)
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
        headerName: 'Country',
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
      {
        headerName: 'Current entry',
        field: 'approved_project_enterprise',
        minWidth: 150,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center justify-center p-2">
            <Link
              className="overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/projects-enterprises/${props.data.project}/view/${props.value}`}
            >
              <span>{getProjectEnterpriseName(props.value)}</span>
            </Link>
          </div>
        ),
        tooltipValueGetter: (props: ITooltipParams) =>
          getProjectEnterpriseName(props.value),
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
