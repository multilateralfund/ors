import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import EnterprisesDataContext from '@ors/contexts/Enterprises/EnterprisesDataContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { enterpriseFieldsMapping } from '../constants'
import { formatNumberColumns } from '../../utils'
import { useStore } from '@ors/store'

import { IoTrash } from 'react-icons/io5'
import { FiEdit } from 'react-icons/fi'
import { find, isNil } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (setIdToDelete: (id: number | null) => void) => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { countries, agencies, project_types, sectors, subsectors } =
    useContext(ProjectsDataContext)
  const { statuses } = useContext(EnterprisesDataContext)

  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data

  const getMeetingNr = (meeting_id: number) =>
    find(meetings, (option) => option.id === meeting_id)?.number

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
              cellClass: 'ag-text-center ag-cell-no-border-r',
              cellRenderer: (props: ICellRendererParams) => (
                <div className="flex items-center gap-1 p-2">
                  <Link
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
          <Link
            className="overflow-hidden truncate whitespace-nowrap"
            href={`/projects-listing/enterprises/${props.data.id}`}
          >
            <span>{props.value}</span>
          </Link>
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
        headerName: enterpriseFieldsMapping.city,
        field: 'city',
        tooltipField: 'city',
      },
      {
        headerName: enterpriseFieldsMapping.location,
        field: 'location',
        tooltipField: 'location',
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
        headerName: enterpriseFieldsMapping.stage,
        field: 'stage',
        tooltipField: 'stage',
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
        headerName: enterpriseFieldsMapping.meeting,
        field: 'meeting',
        valueGetter: (params: ValueGetterParams) =>
          getMeetingNr(params.data.meeting ?? undefined),
        tooltipValueGetter: (params: ITooltipParams) =>
          getMeetingNr(params.data.meeting ?? undefined),
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
        headerName: enterpriseFieldsMapping.status,
        field: 'status',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, statuses, 'status'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, statuses, 'status'),
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
