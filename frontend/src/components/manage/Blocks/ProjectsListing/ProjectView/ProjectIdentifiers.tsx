import { BPTable } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import { booleanDetailItem, detailItem } from './ViewHelperComponents'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { ProjectTypeApi } from '../interfaces'
import { tableColumns } from '../constants'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { Divider } from '@mui/material'

const ProjectIdentifiers = ({ project }: { project: ProjectTypeApi }) => {
  const { viewableFields } = useStore((state) => state.projectFields)
  const canViewBpSection = canViewField(viewableFields, 'bp_activity')

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

  return (
    <>
      <SectionTitle>Identifiers</SectionTitle>
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
          {canViewField(viewableFields, 'country') &&
            detailItem(tableColumns.country, project.country)}
          {canViewField(viewableFields, 'meeting') &&
            detailItem(tableColumns.meeting, project.meeting)}
          {canViewField(viewableFields, 'agency') &&
            detailItem(tableColumns.agency, project.agency)}
          {canViewField(viewableFields, 'cluster') &&
            detailItem(tableColumns.cluster, project.cluster?.name)}
          {canViewField(viewableFields, 'production') &&
            booleanDetailItem(tableColumns.production, project.production)}
          {detailItem(
            tableColumns.submission_status,
            project.submission_status,
          )}
        </div>
      </div>

      {canViewBpSection && (
        <>
          <Divider className="my-6" />
          <SectionTitle>Business Plan</SectionTitle>
          {bp ? (
            <>
              <div>
                Business plan {bp.name} {' - '}
                <span>(Meeting: {bp.meeting_number})</span>
                {bp.decision_id ? (
                  <span>(Decision: {bp.decision_number})</span>
                ) : null}
              </div>
              <BPTable
                yearRanges={[bpYearRange]}
                results={[bpActivity]}
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
