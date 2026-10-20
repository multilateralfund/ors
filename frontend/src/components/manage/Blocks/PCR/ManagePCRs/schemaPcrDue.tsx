import { defaultColDef } from '../PCRListing/schema'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { Checkbox, Chip, Tooltip } from '@mui/material'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'
import { find } from 'lodash'
import { formatDate } from '../utils'
import { IoClose } from 'react-icons/io5'

const getColumnDefs = (unmarkPcrDue: any) => ({
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
          <div className="flex items-center justify-center gap-1 p-2">
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
      headerName: 'PCR due',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.pcr_due_date),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.pcr_due_date),
      cellRenderer: (props: ICellRendererParams) => {
        return (
          <div className="flex w-full items-center gap-1 p-2">
            <span className="min-w-0 flex-1 truncate">
              {props.value ?? '-'}
            </span>
            <div className="ml-auto shrink-0">
              <IoClose
                size={16}
                className="min-h-6 min-w-6 cursor-pointer fill-gray-600"
                onClick={() => unmarkPcrDue([props.data.metaprojectId])}
              />
            </div>
          </div>
        )
      },
    },
  ],
  defaultColDef,
})

export default getColumnDefs
