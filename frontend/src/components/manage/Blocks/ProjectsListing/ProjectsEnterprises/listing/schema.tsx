import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { Button, Checkbox } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'wouter'
import { find } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (
  gridApiRef: any,
  enterpriseId?: number | null,
  setEnterpriseId?: (enterpriseId: number | null) => void,
) => {
  const { project_id } = useParams<Record<string, string>>()

  const commonSlice = useStore((state) => state.common)
  const countries = commonSlice.countries.data

  const { canEditEnterprise, canApproveEnterprise } =
    useContext(PermissionsContext)

  const getCountryName = (params: ValueGetterParams | ITooltipParams) =>
    find(countries, (country) => country.id === params.data.enterprise?.country)
      ?.name

  const approveEnterprise = async (enterpriseId: number) => {
    try {
      const res = await api(`api/project-enterprise/${enterpriseId}/approve/`, {
        method: 'POST',
      })

      const rowNode = gridApiRef.current?.getRowNode(enterpriseId.toString())
      if (rowNode) {
        rowNode.setData({ ...rowNode.data, status: res.status })

        rowNode.setDataValue('status', res.status)
        rowNode.setData({ ...rowNode.data })
      }

      enqueueSnackbar(<>Enterprise was approved successfully.</>, {
        variant: 'success',
      })
    } catch (error) {
      enqueueSnackbar(<>Could not approve enterprise. Please try again.</>, {
        variant: 'error',
      })
    }
  }

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
      },
      {
        headerName: 'Name',
        field: 'enterprise.name',
        tooltipField: 'enterprise.name',
        minWidth: 150,
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center p-2">
            <Link
              className="ml-2 overflow-hidden truncate whitespace-nowrap"
              href={`/projects-listing/projects-enterprises/${props.data.project}/view/${props.data.id}`}
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
        field: 'enterprise.location',
        tooltipField: 'enterprise.location',
      },
      {
        headerName: 'Application',
        field: 'enterprise.application',
        tooltipField: 'enterprise.application',
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
      ...(canApproveEnterprise
        ? [
            {
              headerName: 'Action',
              field: '',
              minWidth: 120,
              maxWidth: 120,
              sortable: false,
              cellClass: 'ag-text-center',
              cellRenderer: (params: ICellRendererParams) =>
                params.data.status !== 'Approved' ? (
                  <Button
                    className="hover:bg-white hover:text-primary hover:shadow-none"
                    onClick={() => approveEnterprise(params.data.id)}
                  >
                    Approve
                  </Button>
                ) : (
                  <></>
                ),
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
