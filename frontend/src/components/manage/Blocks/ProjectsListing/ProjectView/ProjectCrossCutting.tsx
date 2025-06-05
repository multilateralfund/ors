import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import {
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import {
  blanketOrIndConsiderationOpts,
  lvcNonLvcOpts,
  tableColumns,
} from '../constants'
import { BooleanOptionsType, ProjectTypeApi } from '../interfaces'

import { Divider } from '@mui/material'
import { find, map } from 'lodash'

const ProjectCrossCutting = ({ project }: { project: ProjectTypeApi }) => {
  const individual_consideration = find(blanketOrIndConsiderationOpts, {
    id: project.individual_consideration,
  }) as BooleanOptionsType

  const is_lvc = find(lvcNonLvcOpts, {
    id: project.is_lvc,
  }) as BooleanOptionsType
  const subsectors =
    project.subsectors.length > 0
      ? map(project.subsectors, 'name').join(', ')
      : '-'

  return (
    <>
      <SectionTitle>About</SectionTitle>
      <div className="flex w-full flex-col gap-4">
        {detailItem(tableColumns.title, project.title)}
        {detailItem(
          tableColumns.description,
          project.description,
          'self-start',
        )}
        {/* {detailItem(
        tableColumns.individual_consideration,
        individual_consideration?.name,
        )} */}
      </div>

      <Divider className="my-6" />

      <SectionTitle>Details</SectionTitle>

      <div className="flex flex-col gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
            {detailItem(tableColumns.type, project.project_type?.name)}
            {detailItem(tableColumns.sector, project.sector?.name)}
            {detailItem(tableColumns.subsectors, subsectors)}
            {detailItem(tableColumns.is_lvc, is_lvc?.name)}
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 md:grid-cols-3 lg:grid-cols-4">
            {numberDetailItem(tableColumns.total_fund, project.total_fund)}
            {numberDetailItem(
              tableColumns.support_cost_psc,
              project.support_cost_psc,
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 md:grid-cols-3 lg:grid-cols-4">
            {dateDetailItem(
              tableColumns.project_start_date,
              project.project_start_date,
            )}
            {dateDetailItem(
              tableColumns.project_end_date,
              project.project_end_date,
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectCrossCutting
