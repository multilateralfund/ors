import { useContext } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { formatDate } from '@ors/components/manage/Blocks/AnnualProgressReport/utils'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { pcrFieldsMapping } from '../constants'

import { Checkbox } from '@mui/material'
import { FiEdit } from 'react-icons/fi'
import { find, map } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefs = (
  selectedProjectId: number | null,
  setSelectedProjectId: (id: number | null) => void,
) => {
  const { canEditPCR } = useContext(PermissionsContext)
  const { agencies } = useContext(ProjectsDataContext)

  const getFieldValue = (
    params: ValueGetterParams | ITooltipParams,
    data: any,
    field: string,
  ) => find(data, (entry) => entry.id === params.data[field])?.name

  return {
    columnDefs: [
      {
        headerName: pcrFieldsMapping.title,
        field: 'title',
        tooltipField: 'title',
        minWidth: 300,
        cellClass: 'ag-cell-ellipsed',
        cellRenderer: (props: ICellRendererParams) => (
          <div className="flex items-center gap-1 p-2">
            {canEditPCR && (
              <>
                <Link
                  className="flex h-4 w-4 justify-center"
                  href={`/pcr/${props.data.id}/edit`}
                >
                  <FiEdit size={16} />
                </Link>
                <Checkbox
                  checked={selectedProjectId == props.data.id}
                  onChange={(event) => {
                    setSelectedProjectId(
                      event.target.checked ? props.data.id : null,
                    )
                  }}
                  sx={{ color: 'black' }}
                />
              </>
            )}
            <Link
              className="ml-2 overflow-hidden truncate whitespace-nowrap text-inherit underline"
              href={`/pcr/${props.data.id}`}
            >
              {props.value}
            </Link>
          </div>
        ),
      },
      {
        headerName: pcrFieldsMapping.metacode,
        field: 'metacode',
        tooltipField: 'metacode',
      },
      {
        headerName: pcrFieldsMapping.country,
        field: 'country',
        tooltipField: 'country',
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      },
      {
        headerName: pcrFieldsMapping.lead_agency,
        field: 'lead_agency',
        valueGetter: (params: ValueGetterParams) =>
          getFieldValue(params, agencies, 'lead_agency'),
        tooltipValueGetter: (params: ITooltipParams) =>
          getFieldValue(params, agencies, 'lead_agency'),
        cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      },
      {
        headerName: pcrFieldsMapping.cluster,
        field: 'cluster.code',
        tooltipField: 'cluster.name',
      },
      {
        headerName: pcrFieldsMapping.project_type,
        field: 'project_type.code',
        tooltipField: 'project_type.name',
      },
      {
        headerName: pcrFieldsMapping.sector,
        field: 'sector.code',
        tooltipField: 'sector.name',
      },
      {
        headerName: pcrFieldsMapping.subsector,
        valueGetter: (params: ValueGetterParams) =>
          map(
            params.data.subsectors,
            (subsector) => subsector.code ?? subsector.name,
          ).join(', '),
        tooltipValueGetter: (params: ITooltipParams) =>
          map(params.data.subsectors, 'name').join(', '),
        minWidth: 200,
        sortable: false,
      },
      {
        headerName: pcrFieldsMapping.submission_date,
        field: 'project_start_date',
        tooltipField: 'project_start_date',
        valueGetter: (params: ValueGetterParams) =>
          formatDate(params.data.project_start_date),
        tooltipValueGetter: (params: ITooltipParams) =>
          formatDate(params.data.project_start_date),
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
