import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import {
  expandMetaproject,
  defaultColDef,
  getNumberColsValue,
} from '../PCRListing/schema'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { Checkbox, Chip, Tooltip } from '@mui/material'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'
import { find, isNil, uniq } from 'lodash'
import { formatDate } from '../utils'

const getColumnDefs = (
  pcrProjectsData: PCRUpdatedMetaproject[],
  projectIds: number[],
  setProjectIds: (ids: number[]) => void,
) => ({
  columnDefs: [
    {
      headerName: 'Project',
      field: 'umbrella_code',
      minWidth: 300,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => {
        const hasAdHocPcr = find(
          props.data.projects,
          (project) => project.ad_hoc_pcr,
        )

        return (
          <div className="flex items-center gap-1 p-2">
            <div className="flex w-14 shrink-0 items-center">
              <Checkbox
                checked={projectIds.includes(props.data.metaprojectId)}
                onChange={(event) => {
                  const isChecked = event.target.checked
                  const metaprojectId = props.data.metaprojectId

                  setProjectIds(
                    isChecked
                      ? [...projectIds, metaprojectId]
                      : projectIds.filter((item) => item !== metaprojectId),
                  )
                }}
                sx={{ color: 'black' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0">
                <span className="overflow-hidden truncate whitespace-nowrap text-sm font-medium leading-5">
                  {props.value ?? 'N/A'}
                </span>
                <span className="overflow-hidden truncate whitespace-nowrap text-xs leading-4 text-gray-600">
                  {props.data.country ?? 'N/A'} ·{' '}
                  {props.data.lead_agency ?? 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex min-w-14 shrink-0 items-center justify-end gap-1">
              {hasAdHocPcr && (
                <Tooltip title="Ad-hoc PCR" placement="top" arrow>
                  <Chip
                    label="Ad-hoc"
                    className="border-sky-300 bg-sky-50 text-sky-700"
                    variant="outlined"
                    size="small"
                  />
                </Tooltip>
              )}
            </div>
          </div>
        )
      },
      tooltipValueGetter: (props: any) =>
        `${props.value ?? 'N/A'} · ${props.data?.country ?? 'N/A'} · ${props.data?.lead_agency ?? 'N/A'}`,
    },
    {
      headerName: 'Date completed',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.date_completion),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.date_completion),
    },
    {
      headerName: 'Funding approved',
      valueGetter: (params: ValueGetterParams) => {
        const totalFund = getNumberColsValue(params, 'funds_approved')
        const updatedParams = {
          ...params,
          data: { ...params.data, funds_approved: totalFund },
        }

        return !isNil(totalFund)
          ? '$' + formatNumberColumns(updatedParams, 'funds_approved')
          : ''
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const totalFund = getNumberColsValue(params, 'funds_approved')
        const updatedParams = {
          ...params,
          data: { ...params.data, funds_approved: totalFund },
        }

        return formatNumberColumns(updatedParams, 'funds_approved', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        })
      },
    },
  ],
  defaultColDef,
})

export default getColumnDefs
