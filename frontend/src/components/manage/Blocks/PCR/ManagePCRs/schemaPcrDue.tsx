import { TitleColumn, TooltipTitleColumn } from './schema'
import { defaultColDef } from '../PCRListing/schema'
import { formatDate } from '../utils'

import { IoClose } from 'react-icons/io5'
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
      cellRenderer: (props: ICellRendererParams) => (
        <div className="relative flex items-center gap-1 p-1 px-[4.5rem]">
          {TitleColumn(props)}
        </div>
      ),
      tooltipValueGetter: (props: ITooltipParams) => TooltipTitleColumn(props),
    },
    {
      headerName: 'PCR due',
      minWidth: 150,
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
          <div className="relative flex w-full items-center justify-center p-2">
            <span
              className={cx('min-w-0 truncate whitespace-nowrap', {
                'text-red-500': isDateOverdue,
              })}
            >
              {props.value ?? '-'}
            </span>
            <IoClose
              className="absolute right-2 min-h-6 min-w-6 cursor-pointer fill-gray-600"
              onClick={() => unmarkProjects([props.data.id])}
              size={16}
            />
          </div>
        )
      },
    },
  ],
  defaultColDef,
})

export default getColumnDefsPcrDue
