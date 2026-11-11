import Link from '@ors/components/ui/Link/Link'
import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { formatDate } from '@ors/components/manage/Blocks/AnnualProgressReport/utils'
import { LegacyPCRIcon } from '../PCRArchive/PCRArchiveTabs/ArchiveHelperComponents'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { Checkbox, Chip, Tooltip } from '@mui/material'
import { isNil, map, sumBy } from 'lodash'
import {
  ValueGetterParams,
  ICellRendererParams,
  ITooltipParams,
} from 'ag-grid-community'

export const expandMetaproject = (
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

export const defaultColDef = {
  headerClass: 'ag-text-center',
  cellClass: 'ag-text-center ag-cell-ellipsed',
  minWidth: 120,
  resizable: true,
  sortable: false,
}

export const getNumberColsValue = (
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
  setPcrId: (id: number | null) => void,
  setPcrEditable: (editable: boolean) => void,
  view: ViewSelectorValuesType | null,
  canEditPCR: boolean,
) => ({
  columnDefs: [
    {
      headerName: pcrFieldsMapping.title,
      field: 'title',
      tooltipField: 'title',
      minWidth: 300,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => {
        const pcrId =
          props.data.pcr_id ??
          props.data.legacy_pcr_id ??
          props.data.legacy_individual_pcr_id
        const pcrHref = props.data.pcr_id
          ? `/pcr/${props.data.metaprojectId}/${props.data.pcr_id}`
          : props.data.legacy_pcr_id
            ? `/pcr/${props.data.metaprojectId}/archive/${props.data.legacy_pcr_id}`
            : `/pcr/${props.data.metaprojectId}/archive-individual/${props.data.legacy_individual_pcr_id}`

        return (
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
                {(view === 'list' ? canEditPCR : props.data.pcr_editable) && (
                  <Checkbox
                    checked={projectId == props.data.metaprojectId}
                    onChange={(event) => {
                      const isChecked = event.target.checked
                      setProjectId(isChecked ? props.data.metaprojectId : null)
                      setPcrId(isChecked ? (props.data.pcr_id ?? null) : null)
                      setPcrEditable(isChecked && !!props.data.pcr_editable)
                    }}
                    sx={{ color: 'black' }}
                  />
                )}
              </div>
            ) : (
              <div className="flex w-14 shrink-0" />
            )}
            {pcrId ? (
              <Link
                className="min-w-0 flex-1 truncate text-center text-sm text-inherit !underline"
                href={pcrHref}
              >
                {props.value}
              </Link>
            ) : (
              <span className="min-w-0 flex-1 truncate text-center">
                {props.value}
              </span>
            )}
            {view === 'table' && (
              <div className="flex min-w-14 shrink-0 items-center justify-end gap-1">
                {props.data.pcr_approved_in_latest_meeting && (
                  <Tooltip
                    title="PCR approved in the most recent meeting"
                    placement="top"
                    arrow
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                  </Tooltip>
                )}
                {!props.data.pcr_id && pcrId && <LegacyPCRIcon />}
              </div>
            )}
            {view === 'list' && (
              <div className="flex min-w-14 shrink-0 items-center justify-end gap-1">
                {props.data.ad_hoc_pcr && (
                  <Tooltip title="Ad-hoc PCR" placement="top" arrow>
                    <Chip
                      label="Ad-hoc"
                      className="border-sky-300 bg-sky-50 text-sky-700"
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                )}
                {props.data.pcr_due && (
                  <Tooltip title="PCR due" placement="top" arrow>
                    <Chip
                      label="Due"
                      className="border-rose-300 bg-rose-50 text-rose-800"
                      variant="outlined"
                      size="small"
                    />
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        )
      },
    },
    {
      headerName: pcrFieldsMapping.status,
      field: 'status',
      tooltipField: 'status',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 80,
    },
    ...(view === 'table'
      ? [
          {
            headerName: 'PCR status',
            field: 'pcr_status',
            tooltipField: 'pcr_status',
            cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          },
        ]
      : []),
    {
      headerName: pcrFieldsMapping.country,
      field: 'country',
      tooltipField: 'country',
      cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
      minWidth: 150,
    },
    {
      headerName: pcrFieldsMapping.metacode,
      valueGetter: (params: ValueGetterParams) =>
        params.data.isMetaproject
          ? params.data.umbrella_code
          : params.data.metacode,
      tooltipValueGetter: (params: ITooltipParams) =>
        params.data.isMetaproject
          ? params.data.umbrella_code
          : params.data.metacode,
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
      minWidth: 60,
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
    ...(view === 'table'
      ? [
          {
            headerName: pcrFieldsMapping.pcr_submission_date,
            valueGetter: (params: ValueGetterParams) =>
              formatDate(params.data.pcr_submission_date),
            tooltipValueGetter: (params: ITooltipParams) =>
              formatDate(params.data.pcr_submission_date),
          },
          {
            headerName: pcrFieldsMapping.pcr_approval_date,
            valueGetter: (params: ValueGetterParams) =>
              formatDate(params.data.pcr_approval_date),
            tooltipValueGetter: (params: ITooltipParams) =>
              formatDate(params.data.pcr_approval_date),
          },
        ]
      : []),
  ],
  defaultColDef,
})

export default getColumnDefs
