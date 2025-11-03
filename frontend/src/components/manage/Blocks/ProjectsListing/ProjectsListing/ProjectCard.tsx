'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiers from '../ProjectView/ProjectIdentifiers'
import ProjectCrossCutting from '../ProjectView/ProjectCrossCutting'
import ProjectSpecificInfo from '../ProjectView/ProjectSpecificInfo'
import { EditLink } from './ProjectViewButtons'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectSpecificFields, ProjectTypeApi } from '../interfaces'
import { useStore } from '@ors/store'

import { Divider, Box, Modal } from '@mui/material'
import { debounce } from 'lodash'

const ProjectData = ({
  project,
  setIsModalOpen,
}: {
  project: ProjectTypeApi
  setIsModalOpen: (id: number | null) => void
}) => {
  const { canEditProjects } = useContext(PermissionsContext)

  const { id, title, submission_status, code, code_legacy, editable } = project

  const { data, loading } = useGetProject(id.toString())
  const { cluster_id, project_type_id, sector_id } = data || {}

  const { fetchProjectFields, projectFields, setViewableFields } = useStore(
    (state) => state.projectFields,
  )

  const debouncedFetchProjectFields = useMemo(
    () => debounce(() => fetchProjectFields?.(), 0),
    [fetchProjectFields],
  )

  useEffect(() => {
    if (data) {
      debouncedFetchProjectFields()
    }
  }, [data])

  useEffect(() => {
    if (data && projectFields && projectFields.loaded && projectFields.data) {
      setViewableFields?.(data.version, data.submissionStatus)
    }
  }, [projectFields, setViewableFields, data])

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  useEffect(() => {
    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
        id.toString(),
        () => {},
      )
    } else {
      setSpecificFields([])
    }
  }, [cluster_id, project_type_id, sector_id])

  return (
    <div className="m-1.5">
      <div className="flex flex-wrap justify-between gap-x-20 gap-y-3">
        <PageHeading>
          <Link className="cursor-pointer" href={`/projects-listing/${id}`}>
            <span>
              {title}
              {submission_status === 'Approved'
                ? `, ${code ?? code_legacy}`
                : ''}
            </span>
          </Link>
        </PageHeading>
        <div className="flex flex-wrap gap-3">
          <EditLink
            className="border border-solid border-primary bg-white text-primary"
            href={null}
            onClick={() => setIsModalOpen(null)}
          >
            Cancel
          </EditLink>
          <EditLink href={`/projects-listing/${id}`}>View</EditLink>
          {editable && canEditProjects && (
            <EditLink href={`/projects-listing/${id}/edit`}>Edit</EditLink>
          )}
        </div>
      </div>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {data && !loading && (
        <div className="mt-6">
          <ProjectIdentifiers project={data} isListingView={true} />
          <Divider className="my-6" />
          <ProjectCrossCutting project={data} />
          <Divider className="my-6" />
          <ProjectSpecificInfo project={data} {...{ specificFields }} />
        </div>
      )}
    </div>
  )
}

export default function ProjectCard({
  isModalOpen,
  setIsModalOpen,
  project,
}: {
  isModalOpen: boolean
  setIsModalOpen: (id: number | null) => void
  project: ProjectTypeApi
}) {
  return (
    <>
      <Modal
        aria-labelledby="change-status-modal-title"
        open={isModalOpen}
        onClose={() => setIsModalOpen(null)}
        keepMounted
        disableScrollLock
      >
        <Box className="flex max-h-[60%] min-h-[50%] w-full max-w-[60%] flex-col overflow-y-auto absolute-center">
          <ProjectData {...{ project, setIsModalOpen }} />
        </Box>
      </Modal>
    </>
  )
}
