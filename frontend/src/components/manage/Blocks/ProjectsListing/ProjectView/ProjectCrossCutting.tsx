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
import { canViewField, hasFields } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'
import { find, map } from 'lodash'

const ProjectCrossCutting = ({ project }: { project: ProjectTypeApi }) => {
  const { projectFields, viewableFields } = useStore(
    (state) => state.projectFields,
  )

  const canViewAboutSection =
    canViewField(viewableFields, 'title') ||
    canViewField(viewableFields, 'description')
  const canViewDetailsSection = hasFields(
    projectFields,
    viewableFields,
    'Cross-Cutting',
    false,
    ['title', 'description'],
  )

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
      {canViewAboutSection && (
        <>
          <SectionTitle>About</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            {canViewField(viewableFields, 'title') &&
              detailItem(tableColumns.title, project.title)}
            {canViewField(viewableFields, 'description') &&
              detailItem(
                tableColumns.description,
                project.description,
                'self-start',
              )}
          </div>
        </>
      )}

      {canViewAboutSection && canViewDetailsSection && (
        <Divider className="my-6" />
      )}

      {canViewDetailsSection && (
        <>
          <SectionTitle>Details</SectionTitle>

          <div className="flex flex-col gap-4">
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
                {canViewField(viewableFields, 'project_type') &&
                  detailItem(tableColumns.type, project.project_type?.name)}
                {canViewField(viewableFields, 'sector') &&
                  detailItem(tableColumns.sector, project.sector?.name)}
                {canViewField(viewableFields, 'subsectors') &&
                  detailItem(tableColumns.subsectors, subsectors)}
                {canViewField(viewableFields, 'is_lvc') &&
                  detailItem(tableColumns.is_lvc, is_lvc?.name)}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-2 gap-y-4 border-0 md:grid-cols-3 lg:grid-cols-4">
                {canViewField(viewableFields, 'total_fund') &&
                  numberDetailItem(
                    tableColumns.total_fund,
                    project.total_fund as string,
                  )}
                {canViewField(viewableFields, 'support_cost_psc') &&
                  numberDetailItem(
                    tableColumns.support_cost_psc,
                    project.support_cost_psc as string,
                  )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="grid grid-cols-2 gap-y-4 border-0 md:grid-cols-3 lg:grid-cols-4">
                {canViewField(viewableFields, 'project_start_date') &&
                  dateDetailItem(
                    tableColumns.project_start_date,
                    project.project_start_date as string,
                  )}
                {canViewField(viewableFields, 'project_end_date') &&
                  dateDetailItem(
                    tableColumns.project_end_date,
                    project.project_end_date as string,
                  )}
              </div>
            </div>
            {canViewField(viewableFields, 'individual_consideration') &&
              project.submission_status !== 'Draft' &&
              detailItem(
                tableColumns.individual_consideration,
                individual_consideration?.name,
              )}
          </div>
        </>
      )}
    </>
  )
}

export default ProjectCrossCutting
