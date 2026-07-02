import Link from '@ors/components/ui/Link/Link'
import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import { formatDate } from '@ors/components/manage/Blocks/AnnualProgressReport/utils'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { Checkbox } from '@mui/material'
import { FiEdit } from 'react-icons/fi'
import { isNil, map } from 'lodash'
import cx from 'classnames'
import {
  CellClassParams,
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'

const expandMetaproject = (params: ICellRendererParams) => {
  const metaproject = params.data

  const projects = metaproject.projects.map((project: ProjectTypeApi) => ({
    ...project,
    parentId: metaproject.id,
    isMetaproject: false,
  }))

  if (!metaproject.isExpanded) {
    metaproject.isExpanded = true

    params.api.applyTransaction({
      add: projects,
      addIndex: (params.node.rowIndex ?? 0) + 1,
    })
  } else {
    metaproject.isExpanded = false

    params.api.applyTransaction({
      remove: projects,
    })
  }

  params.api.refreshCells({
    rowNodes: [params.node],
    suppressFlash: true,
    force: true,
  })
}

const getCellClass = (data: PCRUpdatedMetaproject) =>
  cx({
    'pcr-metaproject': data.isMetaproject,
    'pcr-expanded-metaproject': data.isExpanded,
  })

const getColumnDefs = (
  projectId: number | null,
  setProjectId: (id: number | null) => void,
) => ({
  columnDefs: [
    {
      headerName: pcrFieldsMapping.title,
      field: 'title',
      tooltipField: 'title',
      minWidth: 300,
      cellClass: (props: CellClassParams) =>
        'ag-cell-ellipsed ag-text-center !pl-0 ' + getCellClass(props.data),
      cellRenderer: (props: ICellRendererParams) => (
        <div className="flex items-center gap-1 p-2">
          {props.data.isMetaproject ? (
            <>
              <div
                className="h-4 w-6 cursor-pointer"
                onClick={() => expandMetaproject(props)}
              >
                {props.data.isExpanded ? (
                  <MdExpandLess size={16} />
                ) : (
                  <MdExpandMore size={16} />
                )}
              </div>
              <Link className="h-4 w-4" href={`/pcr/${props.data.id}/edit`}>
                <FiEdit size={16} />
              </Link>
              <Checkbox
                checked={projectId == props.data.id}
                onChange={(event) => {
                  setProjectId(event.target.checked ? props.data.id : null)
                }}
                sx={{ color: 'black' }}
              />
            </>
          ) : (
            <div className="w-20" />
          )}
          <Link
            className="ml-2 overflow-hidden truncate whitespace-nowrap"
            href={`/pcr/${props.data.id}`}
          >
            <span>{props.value}</span>
          </Link>
        </div>
      ),
    },
    {
      headerName: pcrFieldsMapping.project_status,
      field: 'status',
      tooltipField: 'status',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 120,
    },
    {
      headerName: pcrFieldsMapping.country,
      field: 'country',
      tooltipField: 'country',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 150,
    },
    {
      headerName: pcrFieldsMapping.metacode,
      field: 'metacode',
      tooltipField: 'metacode',
    },
    {
      headerName: pcrFieldsMapping.code,
      field: 'code',
      tooltipField: 'code',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 120,
    },
    {
      headerName: pcrFieldsMapping.cluster,
      field: 'cluster.code',
      tooltipField: 'cluster.name',
    },
    {
      headerName: pcrFieldsMapping.tranche,
      field: 'tranche',
      tooltipField: 'tranche',
      minWidth: 70,
    },
    {
      headerName: pcrFieldsMapping.agency,
      valueGetter: (params: ValueGetterParams) =>
        params.data.isMetaproject
          ? params.data.lead_agency
          : params.data.agency,
      tooltipValueGetter: (params: ITooltipParams) =>
        params.data.isMetaproject
          ? params.data.lead_agency
          : params.data.agency,
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 110,
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
      sortable: false,
      minWidth: 200,
    },
    {
      headerName: pcrFieldsMapping.total_fund,
      field: 'total_fund',
      valueGetter: (params: ValueGetterParams) =>
        !isNil(params.data.total_fund)
          ? '$' + formatNumberColumns(params, 'total_fund')
          : '',
      tooltipValueGetter: (params: ITooltipParams) =>
        formatNumberColumns(params, 'total_fund', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        }),
      minWidth: 120,
    },

    {
      headerName: pcrFieldsMapping.support_cost_psc,
      field: 'support_cost_psc',
      valueGetter: (params: ValueGetterParams) =>
        !isNil(params.data.support_cost_psc)
          ? '$' + formatNumberColumns(params, 'support_cost_psc')
          : '',
      tooltipValueGetter: (params: ITooltipParams) =>
        formatNumberColumns(params, 'support_cost_psc', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        }),
      minWidth: 150,
    },
    {
      headerName: pcrFieldsMapping.submission_date,
      field: 'submission_date',
      tooltipField: 'submission_date',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.submission_date),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.submission_date),
      minWidth: 150,
    },
  ],
  defaultColDef: {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed',
    minWidth: 90,
    resizable: true,
    sortable: true,
  },
})

export default getColumnDefs
