import { defaultColDef } from '../PCRListing/schema'
import { TitleColumn } from './schema'
import { formatDate } from '../utils'

import { IoClose } from 'react-icons/io5'
import { find } from 'lodash'
import cx from 'classnames'
import dayjs from 'dayjs'
import {
  ICellRendererParams,
  ValueGetterParams,
  ITooltipParams,
} from 'ag-grid-community'

const getColumnDefsPcrDue = (unmarkProjects: (ids: number[]) => void) => ({
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
      headerName: 'PCR due',
      valueGetter: (params: ValueGetterParams) =>
        formatDate(params.data.pcr_due_date),
      tooltipValueGetter: (params: ITooltipParams) =>
        formatDate(params.data.pcr_due_date),
      cellRenderer: (props: ICellRendererParams) => {
        const isDateOverdue = dayjs(props.data.pcr_due_date).isBefore(
          dayjs(),
          'day',
        )

        return (
          <div className="flex w-full items-center gap-1 p-2">
            <span
              className={cx(
                'min-w-0 flex-1 overflow-hidden truncate whitespace-nowrap',
                { 'text-red-500': isDateOverdue },
              )}
            >
              {props.value ?? '-'}
            </span>
            <div className="ml-auto shrink-0">
              <IoClose
                className="min-h-6 min-w-6 cursor-pointer fill-gray-600"
                onClick={() => unmarkProjects([props.data.id])}
                size={16}
              />
            </div>
          </div>
        )
      },
    },
  ],
  defaultColDef,
})

export default getColumnDefsPcrDue
