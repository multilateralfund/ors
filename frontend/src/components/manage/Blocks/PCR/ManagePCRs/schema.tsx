import { formatNumberColumns } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { defaultColDef } from '../PCRListing/schema'
import { pcrFieldsMapping } from '../constants'
import { formatDate } from '../utils'

import { Checkbox, Chip, Tooltip } from '@mui/material'
import { isNil } from 'lodash'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

export const TitleColumn = (props: ICellRendererParams) => (
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
    {props.data.ad_hoc_pcr && (
      <div className="absolute right-2">
        <Tooltip title="Ad-hoc PCR" placement="top">
          <Chip
            label="Ad-hoc"
            className="border-sky-300 bg-sky-50 text-sky-700"
            variant="outlined"
            size="small"
          />
        </Tooltip>
      </div>
    )}
  </>
)

export const TooltipTitleColumn = (props: ITooltipParams) =>
  `${props.value ?? 'N/A'} ${
    props.data.type === 'Individual' ? ` · ${props.data.projects[0].title}` : ''
  } · ${props.data.country ?? 'N/A'} · ${props.data.lead_agency ?? '[agency]'}`

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
      cellRenderer: (props: ICellRendererParams) => (
        <div className="relative flex items-center gap-1 px-[4.5rem] py-1 text-center">
          <div className="absolute left-2">
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
          </div>
          {TitleColumn(props)}
        </div>
      ),
      tooltipValueGetter: (props: ITooltipParams) => TooltipTitleColumn(props),
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
        formatDate(params.data.date_of_completion),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.date_of_completion),
    },
    {
      headerName: 'Funding',
      valueGetter: (params: ValueGetterParams) =>
        !isNil(params.data.total_funding)
          ? '$' + formatNumberColumns(params, 'total_funding')
          : '',
      tooltipValueGetter: (params: ITooltipParams) =>
        formatNumberColumns(params, 'total_funding', {
          maximumFractionDigits: 10,
          minimumFractionDigits: 2,
        }),
    },
  ],
  defaultColDef,
})

export default getColumnDefs
