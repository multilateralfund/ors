import { ViewSelectorValuesType } from '@ors/components/manage/Blocks/BusinessPlans/types'
import {
  expandMetaproject,
  commonTableColumns,
  defaultColDef,
} from '../PCRListing/schema'
import { PCRUpdatedMetaproject } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { Checkbox, Chip, Tooltip } from '@mui/material'
import { ICellRendererParams } from 'ag-grid-community'
import { find, uniq } from 'lodash'

const getColumnDefs = (
  pcrProjectsData: PCRUpdatedMetaproject[],
  projectIds: Record<string, number[]>,
  setProjectIds: (ids: Record<string, number[]>) => void,
  view: ViewSelectorValuesType | null,
) => ({
  columnDefs: [
    {
      headerName: pcrFieldsMapping.title,
      field: 'title',
      tooltipField: 'title',
      minWidth: 300,
      cellClass: 'ag-cell-ellipsed ag-text-center !pl-0',
      cellRenderer: (props: ICellRendererParams) => {
        const crtViewProjectsIds =
          view === 'list' ? projectIds.idsToAdd : projectIds.idsToRemove

        const hasAdHocPcr = find(
          props.data.projects,
          (project) => project.ad_hoc_pcr,
        )
        const isPcrDue = find(props.data.projects, (project) => project.pcr_due)

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
                <Checkbox
                  checked={crtViewProjectsIds.includes(
                    props.data.metaprojectId,
                  )}
                  onChange={(event) => {
                    const isChecked = event.target.checked

                    const key = view === 'list' ? 'idsToAdd' : 'idsToRemove'
                    const ids = projectIds[key]
                    const metaprojectId = props.data.metaprojectId

                    setProjectIds({
                      ...projectIds,
                      [key]: isChecked
                        ? uniq([...ids, metaprojectId])
                        : ids.filter((item) => item !== metaprojectId),
                    })
                  }}
                  sx={{ color: 'black' }}
                />
              </div>
            ) : (
              <div className="flex w-14 shrink-0" />
            )}
            <span className="flex-1 overflow-hidden truncate whitespace-nowrap">
              {props.value}
            </span>
            {view === 'table' && (
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
                {isPcrDue && (
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
    ...commonTableColumns,
  ],
  defaultColDef,
})

export default getColumnDefs
