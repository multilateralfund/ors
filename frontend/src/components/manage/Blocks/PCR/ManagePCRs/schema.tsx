import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { defaultColDef, getNumberColsValue } from '../PCRListing/schema'
import { pcrFieldsMapping } from '../constants'
import { formatDate } from '../utils'

import { Checkbox, Chip, Tooltip } from '@mui/material'
import { find, isNil } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

export const TitleColumn = (
  props: ICellRendererParams,
  displayAdHocIcon: boolean,
) => (
  <>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="overflow-hidden truncate whitespace-nowrap text-sm font-medium">
        {props.value ?? 'N/A'}
      </span>
      {props.data.type === 'Individual' && (
        <span className="line-clamp-3 min-w-0 whitespace-normal break-words text-sm font-medium">
          {props.data.projects[0].title}
        </span>
      )}
      <span className="overflow-hidden truncate whitespace-nowrap text-xs text-gray-600">
        {props.data.country ?? 'N/A'} · {props.data.lead_agency ?? '[agency]'}
      </span>
    </div>
    <div className="flex min-w-14 shrink-0 justify-end">
      {displayAdHocIcon && (
        <Tooltip title="Ad-hoc PCR" placement="top">
          <Chip
            label="Ad-hoc"
            className="border-sky-300 bg-sky-50 text-sky-700"
            variant="outlined"
            size="small"
          />
        </Tooltip>
      )}
    </div>
  </>
)

const getColumnDefs = (
  projectIds: number[],
  setProjectIds: (ids: number[]) => void,
) => ({
  columnDefs: [
    {
      headerName: 'Metacode / Title / Country / Agency',
      field: 'umbrella_code',
      minWidth: 300,
      autoHeight: true,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => {
        const hasAdHocPcr = find(
          props.data.projects,
          (project) => project.ad_hoc_pcr,
        )

        return (
          <div className="flex items-center gap-1 p-1">
            <Checkbox
              checked={projectIds.includes(props.data.id)}
              onChange={(event) => {
                const metaprojectId = props.data.id

                setProjectIds(
                  event.target.checked
                    ? [...projectIds, metaprojectId]
                    : projectIds.filter((id) => id !== metaprojectId),
                )
              }}
              sx={{ color: 'black' }}
            />
            {TitleColumn(props, hasAdHocPcr)}
          </div>
        )
      },
      tooltipValueGetter: (props: ITooltipParams) =>
        `${props.value ?? 'N/A'} ${
          props.data.type === 'Individual'
            ? ` · ${props.data.projects[0].title}`
            : ''
        } · ${props.data.country ?? 'N/A'} · ${props.data.lead_agency ?? '[agency]'}`,
    },
    {
      headerName: 'Status',
      field: 'status',
      tooltipField: 'status',
    },
    {
      headerName: pcrFieldsMapping.cluster,
      valueGetter: (params: ValueGetterParams) =>
        params.data.projects[0].cluster,
      tooltipValueGetter: (params: ITooltipParams) =>
        params.data.projects[0].cluster,
      minWidth: 150,
    },
    {
      headerName: 'Date completed',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.date_completion),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.date_completion),
    },
    // {
    //   headerName: 'Funding',
    //   valueGetter: (params: ValueGetterParams) =>
    //     !isNil(params.data.funding)
    //       ? '$' + formatNumberColumns(params.data.funding, 'funding')
    //       : '',
    //   tooltipValueGetter: (params: ITooltipParams) =>
    //     formatNumberColumns(params.data.funding, 'funding', {
    //       maximumFractionDigits: 10,
    //       minimumFractionDigits: 2,
    //     }),
    // },
  ],
  defaultColDef,
})

export default getColumnDefs
