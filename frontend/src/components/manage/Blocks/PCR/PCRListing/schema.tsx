import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { formatDate } from '@ors/components/manage/Blocks/AnnualProgressReport/utils'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { isNil, map, sumBy } from 'lodash'
import { Checkbox } from '@mui/material'
import {
  ValueGetterParams,
  ICellRendererParams,
  ITooltipParams,
} from 'ag-grid-community'

const expandMetaproject = (
  params: ICellRendererParams,
  pcrProjectsData: PCRUpdatedMetaproject[],
) => {
  const metaproject = pcrProjectsData.find(
    (crtMetaproject) => crtMetaproject.id === params.data.metaprojectId,
  )

  if (!!metaproject) {
    const projects = map(metaproject.projects, (project) => ({
      ...project,
      parentId: metaproject.id,
      isMetaproject: false,
    }))

    if (!params.data.isExpanded) {
      params.node.setData({
        ...metaproject,
        isExpanded: true,
      })

      params.api.applyTransaction({
        add: projects,
        addIndex: (params.node.rowIndex ?? 0) + 1,
      })
    } else {
      params.node.setData({
        ...metaproject,
        isExpanded: false,
      })

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
}

const getNumberColsValue = (
  params: ValueGetterParams | ITooltipParams,
  field: string,
) =>
  params.data.type === 'Multi-year agreement'
    ? sumBy(params.data.projects, field)
    : params.data[field]

const getColumnDefs = (
  pcrProjectsData: PCRUpdatedMetaproject[],
  projectId: number | null,
  setProjectId: (id: number | null) => void,
) => ({
  columnDefs: [
    {
      headerName: pcrFieldsMapping.title,
      field: 'title',
      tooltipField: 'title',
      minWidth: 300,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => (
        <div className="flex items-center gap-1 p-2">
          {props.data.isMetaproject ? (
            <div className="flex w-14 shrink-0 items-center">
              {props.data.type === 'Multi-year agreement' ? (
                <div
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => expandMetaproject(props, pcrProjectsData)}
                >
                  {props.data.isExpanded ? (
                    <MdExpandLess size={20} />
                  ) : (
                    <MdExpandMore size={20} />
                  )}
                </div>
              ) : (
                <div className="w-4" />
              )}
              <Checkbox
                checked={projectId == props.data.metaprojectId}
                onChange={(event) => {
                  setProjectId(
                    event.target.checked ? props.data.metaprojectId : null,
                  )
                }}
                sx={{ color: 'black' }}
              />
            </div>
          ) : (
            <div className="flex w-14 shrink-0" />
          )}
          <span className="overflow-hidden truncate whitespace-nowrap">
            {props.value}
          </span>
        </div>
      ),
    },
    {
      headerName: pcrFieldsMapping.status,
      field: 'status',
      tooltipField: 'status',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 150,
    },
    {
      headerName: pcrFieldsMapping.country,
      field: 'country',
      tooltipField: 'country',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 180,
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
      minWidth: 180,
    },
    {
      headerName: pcrFieldsMapping.cluster,
      field: 'cluster',
      tooltipField: 'cluster',
      minWidth: 150,
    },
    {
      headerName: pcrFieldsMapping.tranche,
      field: 'tranche',
      tooltipField: 'tranche',
      minWidth: 70,
    },
    {
      headerName: pcrFieldsMapping.agency,
      field: 'agency',
      tooltipField: 'agency',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
    },
    {
      headerName: pcrFieldsMapping.project_type,
      field: 'project_type',
      tooltipField: 'project_type',
    },
    {
      headerName: pcrFieldsMapping.sector,
      field: 'sector',
      tooltipField: 'sector',
    },
    {
      headerName: pcrFieldsMapping.subsectors,
      field: 'subsectors',
      tooltipField: 'subsectors',
      minWidth: 200,
    },
    {
      headerName: pcrFieldsMapping.total_fund,
      valueGetter: (params: ValueGetterParams) => {
        const totalFund = getNumberColsValue(params, 'total_fund')
        const updatedParams = {
          ...params,
          data: { ...params.data, total_fund: totalFund },
        }

        return !isNil(totalFund)
          ? '$' + formatNumberColumns(updatedParams, 'total_fund')
          : ''
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const totalFund = getNumberColsValue(params, 'total_fund')
        const updatedParams = {
          ...params,
          data: { ...params.data, total_fund: totalFund },
        }

        return formatNumberColumns(updatedParams, 'total_fund', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        })
      },
    },
    {
      headerName: pcrFieldsMapping.support_cost_psc,
      valueGetter: (params: ValueGetterParams) => {
        const supportCost = getNumberColsValue(params, 'support_cost_psc')
        const updatedParams = {
          ...params,
          data: { ...params.data, support_cost_psc: supportCost },
        }

        return !isNil(supportCost)
          ? '$' + formatNumberColumns(updatedParams, 'support_cost_psc')
          : ''
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const supportCost = getNumberColsValue(params, 'support_cost_psc')
        const updatedParams = {
          ...params,
          data: { ...params.data, support_cost_psc: supportCost },
        }

        return formatNumberColumns(updatedParams, 'support_cost_psc', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        })
      },
    },
    {
      headerName: pcrFieldsMapping.pcr_submission_date,
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.pcr_submission_date),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.pcr_submission_date),
    },
  ],
  defaultColDef: {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed',
    minWidth: 120,
    resizable: true,
    sortable: false,
  },
})

export default getColumnDefs
