import { useContext, useCallback } from 'react'

import { BPTable } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { booleanDetailItem, detailItem } from './ViewHelperComponents'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { tableColumns, viewColumnsClassName } from '../constants'
import { ProjectTypeApi } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'
import { find } from 'lodash'

const ProjectIdentifiers = ({
  project,
  fieldHistory,
}: {
  project: ProjectTypeApi
  fieldHistory: any
}) => {
  const { canViewBp } = useContext(PermissionsContext)

  const { viewableFields } = useStore((state) => state.projectFields)
  const canViewBpSection = canViewField(viewableFields, 'bp_activity')

  const { agencies } = useContext(ProjectsDataContext)
  const leadAgency =
    find(agencies, (agency) => agency.id === project.meta_project?.lead_agency)
      ?.name ?? '-'

  const bpActivity = {
    ...project.bp_activity,
    get display_internal_id(): string {
      const countryAbbr = this.country?.abbr ?? ''
      const agency = this.agency?.name ?? ''
      const id = this.id?.toString() ?? ''
      return `${agency}-${countryAbbr}-0000${id}`
    },
  }
  const bp = bpActivity?.business_plan

  const bpYearRange = bp
    ? {
        year_start: bp.year_start,
        year_end: bp.year_end,
        status: bp.status,
      }
    : {}

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  return (
    <>
      <SectionTitle>Identifiers</SectionTitle>
      <div className="flex w-full flex-col gap-4">
        <div className={viewColumnsClassName}>
          {canViewField(viewableFields, 'country') &&
            detailItem(tableColumns.country, project.country, {
              fieldHistory: getFieldHistory('country'),
            })}
          {detailItem(tableColumns.meeting, project.meeting, {
            fieldHistory: getFieldHistory('meeting'),
          })}
          {canViewField(viewableFields, 'agency') &&
            detailItem(tableColumns.agency, project.agency, {
              fieldHistory: getFieldHistory('agency'),
            })}
          {canViewField(viewableFields, 'lead_agency') &&
            detailItem(tableColumns.lead_agency, leadAgency, {
              fieldHistory: getFieldHistory('lead_agency'),
            })}
          {canViewField(viewableFields, 'cluster') &&
            detailItem(tableColumns.cluster, project.cluster?.name, {
              fieldHistory: getFieldHistory('cluster'),
            })}
          {canViewField(viewableFields, 'production') &&
            booleanDetailItem(
              tableColumns.production,
              project.production,
              getFieldHistory('production'),
            )}
          {detailItem(
            tableColumns.submission_status,
            project.submission_status,
          )}
        </div>
      </div>
      {project.version > 3 ? (
        <div>
          <Divider className="my-6" />
          <SectionTitle>Post ExCom updates</SectionTitle>
          <div>
            {detailItem(
              'Meeting',
              project.post_excom_meeting?.toString() ?? '-',
            )}
            {detailItem('Decision', project.post_excom_decision?.number ?? '-')}
          </div>
        </div>
      ) : null}

      {canViewBp && canViewBpSection && (
        <>
          <Divider className="my-6" />
          <SectionTitle>Business Plan</SectionTitle>
          {bp ? (
            <>
              <div>
                Business plan {bp.name} {' - '}
                <span>(Meeting: {bp.meeting_number})</span>
                {bp.decision_id ? (
                  <span>{`(Decision: ${bp.decision_number})`}</span>
                ) : null}
              </div>
              <BPTable
                yearRanges={[bpYearRange]}
                results={[bpActivity]}
                count={1}
                isProjectsSection={true}
                loaded={true}
                loading={false}
                filters={{
                  year_start: bp.year_start,
                  year_end: bp.year_end,
                }}
              />
            </>
          ) : (
            '-'
          )}
        </>
      )}
    </>
  )
}

export default ProjectIdentifiers
