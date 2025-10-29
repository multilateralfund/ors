'use client'

import { useEffect, useMemo, useState } from 'react'

import ProjectHistory from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectHistory.tsx'
import ProjectIdentifiers from './ProjectIdentifiers'
import ProjectCrossCutting from './ProjectCrossCutting'
import ProjectSpecificInfo from './ProjectSpecificInfo'
import ProjectApproval from './ProjectApproval'
import ProjectImpact from './ProjectImpact'
import ProjectDocumentation from './ProjectDocumentation'
import ProjectRelatedProjects from './ProjectRelatedProjects'
import { LoadingTab } from '../HelperComponents'
import useGetRelatedProjects from '../hooks/useGetRelatedProjects'
import { ProjectFile, ProjectViewProps } from '../interfaces'
import { getSectionFields, hasFields } from '../utils'
import useClickOutside from '@ors/hooks/useClickOutside'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoDownloadOutline } from 'react-icons/io5'
import { Tabs, Tab, Tooltip } from '@mui/material'
import { debounce, isArray, isNull } from 'lodash'

import cx from 'classnames'

const ProjectDownloads = ({
  project,
}: {
  project: ProjectViewProps['project']
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const toggleShowMenu = () => setShowMenu((prev) => !prev)

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowMenu(false)
  })

  const urlXLS = formatApiUrl(
    `/api/projects/v2/export?project_id=${project.id}`,
  )
  const urlDOC = formatApiUrl(
    `/api/projects/v2/export?project_id=${project.id}&output_format=docx`,
  )

  return (
    <div className="relative">
      <div
        className="flex cursor-pointer items-center justify-between text-nowrap"
        ref={ref}
        onClick={toggleShowMenu}
      >
        <Tooltip placement="top" title="Download">
          <div className="flex items-center justify-between gap-x-2">
            <span>Download</span>
            <IoDownloadOutline className="text-xl text-secondary" />
          </div>
        </Tooltip>
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-md border border-solid border-gray-300 bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showMenu,
            'scale-y-100 opacity-100': showMenu,
          },
        )}
      >
        <a
          className="flex items-center gap-x-2 text-nowrap px-2 py-1 text-base text-black no-underline transition-all hover:bg-primary hover:text-mlfs-hlYellow"
          href={urlXLS}
          target="_blank"
        >
          <AiFillFileExcel className="fill-green-700" size={24} />
          <span>XLSX</span>
        </a>
        <a
          className="flex items-center gap-x-2 text-nowrap px-2 py-1 text-base text-black no-underline transition-all hover:bg-primary hover:text-mlfs-hlYellow"
          href={urlDOC}
          target="_blank"
        >
          <AiFillFilePdf className="fill-red-700" size={24} />
          <span>DOCX</span>
        </a>
      </div>
    </div>
  )
}

const ProjectView = ({
  project,
  projectFiles,
  specificFields,
  specificFieldsLoaded,
  loadedFiles,
}: ProjectViewProps & {
  projectFiles: ProjectFile[]
  specificFieldsLoaded: boolean
  loadedFiles: boolean
}) => {
  const [activeTab, setActiveTab] = useState(0)

  const {
    fetchProjectFields,
    projectFields: allFields,
    viewableFields,
    setViewableFields,
  } = useStore((state) => state.projectFields)

  const { fieldHistory, fetchFieldHistory } = useStore(
    (state) => state.projectFieldHistory,
  )

  useEffect(() => {
    fetchFieldHistory(project.id)
  }, [fetchFieldHistory, JSON.stringify(project)])

  const debouncedFetchProjectFields = useMemo(
    () => debounce(() => fetchProjectFields?.(), 0),
    [fetchProjectFields],
  )

  useEffect(() => {
    debouncedFetchProjectFields()
  }, [])

  useEffect(() => {
    if (allFields && allFields.loaded && allFields.data) {
      setViewableFields?.(project.version, project.submission_status)
    }
  }, [allFields, setViewableFields])

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]
  const hasApprovalTab = project.version >= 3

  const approvalFields = hasApprovalTab
    ? ((isArray(allFields) ? allFields : allFields?.data)?.filter(
        (field) => field.section === 'Approval',
      ) ?? [])
    : []

  const relatedProjects = useGetRelatedProjects(project, 'view')

  const tabs = [
    {
      id: 'project-identifiers',
      label: 'Identifiers',
      component: (
        <ProjectIdentifiers
          {...{ project, specificFields, fieldHistory: fieldHistory.data }}
        />
      ),
    },
    {
      id: 'project-cross-cutting',
      label: 'Cross-Cutting',
      disabled: !hasFields(allFields, viewableFields, 'Cross-Cutting'),
      component: (
        <ProjectCrossCutting
          {...{ project, fieldHistory: fieldHistory.data }}
        />
      ),
    },
    {
      id: 'project-specific-info',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Specific Information</div>
          {!specificFieldsLoaded && LoadingTab}
        </div>
      ),
      disabled:
        (!substanceDetailsFields.length && !overviewFields.length) ||
        (!hasFields(allFields, viewableFields, 'Header') &&
          !hasFields(allFields, viewableFields, 'Substance Details')),
      component: (
        <ProjectSpecificInfo
          {...{ project, specificFields }}
          fieldHistory={fieldHistory.data}
        />
      ),
    },
    {
      id: 'project-impact',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Impact</div>
          {!specificFieldsLoaded && LoadingTab}
        </div>
      ),
      disabled:
        !impactFields.length || !hasFields(allFields, viewableFields, 'Impact'),

      component: (
        <ProjectImpact
          {...{ project, specificFields }}
          fieldHistory={fieldHistory.data}
        />
      ),
    },
    {
      id: 'project-documentation',
      label: 'Attachments',
      component: (
        <ProjectDocumentation {...{ projectFiles, loadedFiles }} mode="view" />
      ),
    },
    ...(hasApprovalTab
      ? [
          {
            id: 'project-approval',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">Approval</div>
                {approvalFields.length === 0 && LoadingTab}
              </div>
            ),
            disabled:
              !approvalFields.length ||
              !hasFields(allFields, viewableFields, 'Approval'),
            component: (
              <ProjectApproval
                specificFields={approvalFields}
                {...{ project }}
                fieldHistory={fieldHistory.data}
              />
            ),
          },
        ]
      : []),
    ...(isNull(project.latest_project)
      ? [
          {
            id: 'project-related-projects-section',
            label: 'Related projects',
            component: <ProjectRelatedProjects {...{ relatedProjects }} />,
          },
        ]
      : []),
    ...(isNull(project.latest_project)
      ? [
          {
            id: 'project-history-section',
            label: 'History',
            component: <ProjectHistory project={project} />,
          },
        ]
      : []),
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs
          aria-label="view-project"
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
        <div>
          <div className="flex items-center justify-between gap-x-2">
            <ProjectDownloads project={project} />
          </div>
        </div>
      </div>
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

export default ProjectView
