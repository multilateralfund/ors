import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { detailItem } from './ViewHelperComponents'
import { ProjectTypeApi } from '../interfaces'
import { tableColumns } from '../constants'

import { Divider } from '@mui/material'

const ProjectIdentifiers = ({ project }: { project: ProjectTypeApi }) => {
  return (
    <>
      <SectionTitle>Identifiers</SectionTitle>
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
          {detailItem(tableColumns.country, project.country)}
          {detailItem(tableColumns.meeting, project.meeting)}
          {detailItem(tableColumns.agency, project.agency)}
          {detailItem(tableColumns.cluster, project.cluster?.name)}
          {detailItem(
            tableColumns.submission_status,
            project.submission_status,
          )}
        </div>
      </div>

      <Divider className="my-6" />

      <SectionTitle>Business Plan</SectionTitle>
      {detailItem(tableColumns.bp_activity, project.bp_activity?.toString())}
    </>
  )
}

export default ProjectIdentifiers
