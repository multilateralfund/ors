import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { enterpriseFieldsMapping } from '../../ProjectsEnterprises/constants'
import { formatNumberColumns } from '../../utils'

import { IoTrash } from 'react-icons/io5'
import { FiEdit } from 'react-icons/fi'
import { find, isNil } from 'lodash'
import dayjs from 'dayjs'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (setIdToDelete: (idToDelete: number | null) => void) => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)

  const getFieldValue = (
    params: ValueGetterParams | ITooltipParams,
    data: any,
    field: string,
  ) => find(data, (entry) => entry.id === params.data[field])?.name

  const getDecimalValue = (
    params: ValueGetterParams | ITooltipParams,
    field: string,
  ) => (!isNil(params.data[field]) ? formatNumberColumns(params, field) : '')

  return {
    columnDefs: [
      ...(canEditEnterprise
        ? [
            {
              minWidth: 80,
              maxWidth: 80,
              resizable: false,
              sortable: false,
              cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-no-border-r',
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center gap-1 p-2">
                  <Link
                    className="flex h-4 w-4 justify-center"
                    href={`/projects-listing/enterprises/${props.data.id}/edit`}
                  >
                    <FiEdit size={16} />
                  </Link>
                  /
                  <IoTrash
                    size={18}
                    className="cursor-pointer fill-gray-500"
                    onClick={() => {
                      setIdToDelete(props.data.id)
                    }}
                  />
                </div>
              ),
            },
          ]
        : []),
      {
        headerName: enterpriseFieldsMapping.code,
        field: 'code',
        tooltipField: 'code',
        minWidth: 100,
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
        headerName: enterpriseFieldsMapping.name,
        field: 'name',
        tooltipField: 'name',
        cellClass: 'ag-cell-ellipsed !pl-2.5',
        minWidth: 200,
      },

      {
        headerName: enterpriseFieldsMapping.country,
        field: 'country__name',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, countries, 'country'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, countries, 'country'),
      },
      {
        headerName: enterpriseFieldsMapping.agency,
        field: 'agency__name',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, agencies, 'agency'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, agencies, 'agency'),
      },
      {
        headerName: enterpriseFieldsMapping.project_type,
        field: 'project_type',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, project_types, 'project_type'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, project_types, 'project_type'),
      },
      {
        headerName: enterpriseFieldsMapping.location,
        field: 'location',
        tooltipField: 'location',
      },
      {
        headerName: enterpriseFieldsMapping.city,
        field: 'city',
        tooltipField: 'city',
      },
      {
        headerName: enterpriseFieldsMapping.stage,
        field: 'stage',
        tooltipField: 'stage',
      },
      {
        headerName: enterpriseFieldsMapping.sector,
        field: 'sector',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, sectors, 'sector'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, sectors, 'sector'),
      },
      {
        headerName: enterpriseFieldsMapping.subsector,
        field: 'subsector',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, subsectors, 'subsector'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, subsectors, 'subsector'),
      },
      {
        headerName: enterpriseFieldsMapping.application,
        field: 'application',
        tooltipField: 'application',
      },
      {
        headerName: enterpriseFieldsMapping.local_ownership,
        field: 'local_ownership',
        valueGetter: (params: ValueGetterParams) =>
          getDecimalValue(params, 'local_ownership'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getDecimalValue(params, 'local_ownership'),
      },
      {
        headerName: enterpriseFieldsMapping.export_to_non_a5,
        field: 'export_to_non_a5',
        valueGetter: (params: ValueGetterParams) =>
          getDecimalValue(params, 'export_to_non_a5'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getDecimalValue(params, 'export_to_non_a5'),
      },
      {
        headerName: enterpriseFieldsMapping.revision,
        field: 'revision',
        tooltipField: 'revision',
      },
      {
        headerName: enterpriseFieldsMapping.date_of_revision,
        field: 'date_of_revision',
        valueGetter: (params: ValueGetterParams) => {
          const value = params.data.date_of_revision
          return value ? dayjs(value).format('DD/MM/YYYY') : ''
        },
        tooltipValueGetter: (params: ITooltipParams) => {
          const value = params.data.date_of_revision
          return value ? dayjs(value).format('DD/MM/YYYY') : ''
        },
      },
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
