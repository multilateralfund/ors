import { useContext, useCallback } from 'react'

import { BPTable } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import Link from '@ors/components/ui/Link/Link'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { booleanDetailItem, detailItem } from './ViewHelperComponents'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { tableColumns, viewColumnsClassName } from '../constants'
import { ProjectTypeApi } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { FaExternalLinkAlt } from 'react-icons/fa'
import { Divider } from '@mui/material'
import { find, map } from 'lodash'

const ProjectIdentifiers = ({
  project,
  fieldHistory,
  isListingView = false,
}: {
  project: ProjectTypeApi
  fieldHistory?: any
  isListingView?: boolean
}) => {
  const { canViewBp } = useContext(PermissionsContext)

  const { viewableFields } = useStore((state) => state.projectFields)
  const canViewBpSection = canViewField(viewableFields, 'bp_activity')

  const { agencies } = useContext(ProjectsDataContext)
  const leadAgency =
    find(agencies, (agency) => agency.id === project.lead_agency)?.name ?? '-'

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

  const BpDetails = () =>
    bp && (
      <div>
        Business plan {bp.name} {' - '}
        <span>(Meeting: {bp.meeting_number})</span>
        {bp.decision_id ? (
          <span>{`(Decision: ${bp.decision_number})`}</span>
        ) : null}
      </div>
    )

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  const formattedHistoryDecision = map(
    getFieldHistory('post_excom_decision'),
    (history) => ({
      ...history,
      value: history.value ? history.value.number : null,
    }),
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
          {project.status === 'Transferred' &&
            detailItem(tableColumns.transfer_meeting, project.transfer_meeting)}
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
          {detailItem(tableColumns.category, project.cluster?.category)}
          {detailItem(
            tableColumns.submission_status,
            project.submission_status,
          )}
        </div>
      </div>
      {project.version > 3 && !isListingView ? (
        <div>
          <Divider className="my-6" />
          <SectionTitle>Post ExCom updates</SectionTitle>
          <div className="flex flex-col gap-y-4">
            {detailItem(
              'Meeting',
              project.post_excom_meeting?.toString() ?? '-',
              {
                fieldHistory: getFieldHistory('post_excom_meeting'),
              },
            )}
            {detailItem(
              'Decision',
              project.post_excom_decision?.number ?? '-',
              {
                fieldHistory: formattedHistoryDecision,
              },
            )}
          </div>
        </div>
      ) : null}

      {canViewBp && canViewBpSection && (
        <>
          <Divider className="my-6" />
          <SectionTitle>Business Plan</SectionTitle>
          {bp ? (
            <>
              {isListingView ? (
                <>
                  <Link
                    component="a"
                    className="mb-4 flex items-center gap-2 text-lg normal-case leading-tight text-inherit no-underline"
                    href={`/business-plans/list/activities/${bp.year_start}-${bp.year_end}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={(e: React.SyntheticEvent) => e.stopPropagation()}
                  >
                    <FaExternalLinkAlt
                      size={14}
                      className="mb-0.5 min-h-[14px] min-w-[14px]"
                    />
                    <BpDetails />
                  </Link>
                  <span className="flex gap-2">
                    <span>Activity ID</span>
                    <h4 className="m-0">{bpActivity?.display_internal_id}</h4>
                  </span>
                </>
              ) : (
                <>
                  <BpDetails />
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
              )}
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
