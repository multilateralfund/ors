import { useCallback } from 'react'
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
  viewColumnsClassName,
} from '../constants'
import { BooleanOptionsType, ProjectTypeApi } from '../interfaces'
import { canViewField, hasFields } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'
import { find, map } from 'lodash'

const ProjectCrossCutting = ({
  project,
  fieldHistory,
}: {
  project: ProjectTypeApi
  fieldHistory: any
}) => {
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

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  return (
    <>
      {canViewAboutSection && (
        <>
          <SectionTitle>About</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            {canViewField(viewableFields, 'title') &&
              detailItem(tableColumns.title, project.title, {
                fieldHistory: getFieldHistory('title'),
              })}
            {canViewField(viewableFields, 'description') &&
              detailItem(tableColumns.description, project.description, {
                detailClassname: 'self-start',
                fieldHistory: getFieldHistory('description'),
              })}
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
              <div className={viewColumnsClassName}>
                {canViewField(viewableFields, 'project_type') &&
                  detailItem(tableColumns.type, project.project_type?.name, {
                    fieldHistory: getFieldHistory('project_type'),
                  })}
                {canViewField(viewableFields, 'sector') &&
                  detailItem(tableColumns.sector, project.sector?.name, {
                    fieldHistory: getFieldHistory('sector'),
                  })}
                {canViewField(viewableFields, 'subsectors') &&
                  detailItem(tableColumns.subsectors, subsectors, {
                    fieldHistory: getFieldHistory('subsectors'),
                  })}
                {canViewField(viewableFields, 'is_lvc') &&
                  detailItem(tableColumns.is_lvc, is_lvc?.name, {
                    fieldHistory: getFieldHistory('is_lvc'),
                  })}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className={viewColumnsClassName}>
                {canViewField(viewableFields, 'total_fund') &&
                  numberDetailItem(
                    tableColumns.total_fund,
                    project.total_fund as string,
                    getFieldHistory('total_fund'),
                  )}
                {canViewField(viewableFields, 'support_cost_psc') &&
                  numberDetailItem(
                    tableColumns.support_cost_psc,
                    project.support_cost_psc as string,
                    getFieldHistory('support_cost_psc'),
                  )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className={viewColumnsClassName}>
                {canViewField(viewableFields, 'project_start_date') &&
                  dateDetailItem(
                    tableColumns.project_start_date,
                    project.project_start_date as string,
                    getFieldHistory('project_start_date'),
                  )}
                {canViewField(viewableFields, 'project_end_date') &&
                  dateDetailItem(
                    tableColumns.project_end_date,
                    project.project_end_date as string,
                    getFieldHistory('project_end_date'),
                  )}
              </div>
            </div>
            {canViewField(viewableFields, 'individual_consideration') &&
              detailItem(
                tableColumns.individual_consideration,
                individual_consideration?.name,
                {
                  fieldHistory: getFieldHistory('individual_consideration'),
                },
              )}
          </div>
        </>
      )}
    </>
  )
}

export default ProjectCrossCutting
