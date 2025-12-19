'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiers from '../ProjectView/ProjectIdentifiers'
import ProjectCrossCutting from '../ProjectView/ProjectCrossCutting'
import ProjectSpecificInfo from '../ProjectView/ProjectSpecificInfo'
import { ProjectStatusInfo } from '../HelperComponents'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectSpecificFields, ProjectTypeApi } from '../interfaces'
import { getSectionFields, hasFields } from '../utils'
import { useStore } from '@ors/store'

import { Box, Modal, Tabs, Tab } from '@mui/material'
import { TfiClose } from 'react-icons/tfi'
import { FiEdit } from 'react-icons/fi'
import { FiEye } from 'react-icons/fi'
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
        className="sectionsTabs projectCardView"
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
              disabled: 'text-gray-600',
            }}
          />
        ))}
      </Tabs>
      <div className="relative bg-white p-6">
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
      <Box className="flex min-h-[250px] w-[80%] max-w-[1400px] flex-col overflow-y-auto rounded-2xl border border-solid border-primary bg-primary p-0 absolute-center 2xl:w-[60%]">
        <div>
          <div className="mx-6 mt-4 flex flex-wrap justify-between gap-x-10 gap-y-3">
            <PageHeading className="max-w-[85%] !text-[28px] text-white">
              {title}
              {submission_status === 'Approved'
                ? `, ${code ?? code_legacy}`
                : ''}
            </PageHeading>
            <div className="flex gap-6">
              <Link
                className="flex h-6 w-6 justify-center"
                href={`/projects/${id}`}
              >
                <FiEye size={24} color="white" />
              </Link>
              {editable && canEditProjects && (
                <Link
                  className="flex h-6 w-6 justify-center"
                  href={`/projects/${id}/edit`}
                >
                  <FiEdit size={24} color="white" />
                </Link>
              )}
              <Link
                className="flex h-6 w-6 cursor-pointer justify-center"
                href={null}
              >
                <TfiClose
                  size={24}
                  color="white"
                  onClick={() => setIsModalOpen(null)}
                />
              </Link>
            </div>
          </div>
          <div className="mx-6 my-5">
            <ProjectStatusInfo
              {...{ project }}
              textClassName="text-white"
              chipClassName="text-white border-white"
            />
          </div>
          <Loading
            className="!fixed bg-action-disabledBackground"
            ProgressStyle={{ color: 'white' }}
            active={loading}
          />
          {data && !loading && <ProjectData project={data} />}
        </div>
      </Box>
    </Modal>
  )
}
