'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiers from '../ProjectView/ProjectIdentifiers'
import ProjectCrossCutting from '../ProjectView/ProjectCrossCutting'
import ProjectSpecificInfo from '../ProjectView/ProjectSpecificInfo'
import { EditLink } from './ProjectViewButtons'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectSpecificFields, ProjectTypeApi } from '../interfaces'
import { getSectionFields, hasFields } from '../utils'
import { useStore } from '@ors/store'

import { Box, Modal, Tabs, Tab } from '@mui/material'
import { debounce } from 'lodash'

const ProjectData = ({ project }: { project: ProjectTypeApi }) => {
  const hasFetchedSpecificFields = useRef(false)

  const { id, cluster_id, project_type_id, sector_id } = project

  const {
    fetchProjectFields,
    projectFields,
    viewableFields,
    setViewableFields,
  } = useStore((state) => state.projectFields)

  const debouncedFetchProjectFields = useMemo(
    () => debounce(() => fetchProjectFields?.(), 0),
    [fetchProjectFields],
  )

  useEffect(() => {
    debouncedFetchProjectFields()
  }, [])

  useEffect(() => {
    if (projectFields.loaded && projectFields.data) {
      setViewableFields?.(project.version, project.submission_status)
    }
  }, [projectFields, setViewableFields])

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  useEffect(() => {
    if (
      !hasFetchedSpecificFields.current &&
      cluster_id &&
      project_type_id &&
      sector_id
    ) {
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
    hasFetchedSpecificFields.current = true
  }, [])

  const [activeTab, setActiveTab] = useState(0)

  const [overviewFields, substanceDetailsFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
  ]

  const tabs = [
    {
      id: 'project-identifiers',
      label: 'Identifiers',
      component: <ProjectIdentifiers isListingView={true} {...{ project }} />,
    },
    {
      id: 'project-cross-cutting',
      label: 'Cross-Cutting',
      disabled: !hasFields(projectFields, viewableFields, 'Cross-Cutting'),
      component: <ProjectCrossCutting {...{ project }} />,
    },
    {
      id: 'project-specific-info',
      label: 'Specific Information',
      disabled:
        (!substanceDetailsFields.length && !overviewFields.length) ||
        (!hasFields(projectFields, viewableFields, 'Header') &&
          !hasFields(projectFields, viewableFields, 'Substance Details')),
      component: <ProjectSpecificInfo {...{ project, specificFields }} />,
    },
  ]

  return (
    <>
      <Tabs
        aria-label="view-project-card"
        value={activeTab}
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(_, newValue) => {
          setActiveTab(newValue)
        }}
      >
        {tabs.map(({ id, label, disabled }) => (
          <Tab
            key={id}
            id={id}
            aria-controls={id}
            label={label}
            disabled={disabled}
            classes={{
              disabled: 'text-gray-300',
            }}
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === activeTab)
          .map(({ id, component }) => (
            <span key={id}>{component}</span>
          ))}
      </div>
    </>
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
  const { canEditProjects } = useContext(PermissionsContext)
  const { id, title, submission_status, code, code_legacy, editable } = project
  const { data, loading } = useGetProject(id.toString())

  return (
    <Modal
      aria-labelledby="change-status-modal-title"
      open={isModalOpen}
      onClose={() => setIsModalOpen(null)}
      disableScrollLock
      keepMounted
    >
      <Box className="flex max-h-[60%] min-h-[50%] w-full max-w-[60%] flex-col overflow-y-auto absolute-center">
        <div className="m-1.5">
          <div className="flex flex-wrap justify-between gap-x-20 gap-y-3">
            <PageHeading>
              {title}
              {submission_status === 'Approved'
                ? `, ${code ?? code_legacy}`
                : ''}
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
          {data && !loading && <ProjectData project={data} />}
        </div>
      </Box>
    </Modal>
  )
}
