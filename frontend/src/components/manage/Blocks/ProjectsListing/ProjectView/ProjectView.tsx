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
import useGetRelatedProjects from '../hooks/useGetRelatedProjects'
import { getSectionFields, hasFields } from '../utils'
import {
  ProjectFile,
  ProjectViewProps,
  ProjectSpecificFields,
} from '../interfaces'
import useClickOutside from '@ors/hooks/useClickOutside'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoDownloadOutline } from 'react-icons/io5'
import { Tabs, Tab, Tooltip, CircularProgress } from '@mui/material'
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
}: ProjectViewProps & {
  projectFiles: ProjectFile[]
  specificFieldsLoaded: boolean
}) => {
  const [activeTab, setActiveTab] = useState(0)

  const {
    fetchProjectFields,
    projectFields: allFields,
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
    if (allFields && allFields.loaded && allFields.data) {
      setViewableFields?.(project.version, project.submission_status)
    }
  }, [allFields, setViewableFields])

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]
  const approvalFields =
    project.version === 3
      ? ((isArray(allFields) ? allFields : allFields?.data)?.filter(
          (field) => field.section === 'Approval',
        ) ?? [])
      : []

  const relatedProjects = useGetRelatedProjects(project, 'view')

  const classes = {
    disabled: 'text-gray-200',
  }

  const tabs = [
    {
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: 'Identifiers',
      component: <ProjectIdentifiers {...{ project, specificFields }} />,
    },
    {
      id: 'project-cross-cutting',
      ariaControls: 'project-cross-cutting',
      label: 'Cross-Cutting',
      disabled: !hasFields(allFields, viewableFields, 'Cross-Cutting'),
      classes: classes,
      component: <ProjectCrossCutting {...{ project }} />,
    },
    {
      id: 'project-specific-info',
      ariaControls: 'project-specific-info',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Specific Information</div>
          {!specificFieldsLoaded && (
            <CircularProgress size="20px" className="mb-0.5 text-gray-400" />
          )}
        </div>
      ),
      disabled:
        (!substanceDetailsFields.length && !overviewFields.length) ||
        (!hasFields(allFields, viewableFields, 'Header') &&
          !hasFields(allFields, viewableFields, 'Substance Details')),
      classes: classes,
      component: <ProjectSpecificInfo {...{ project, specificFields }} />,
    },
    {
      id: 'project-impact',
      ariaControls: 'project-impact',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Impact</div>
          {!specificFieldsLoaded && (
            <CircularProgress size="20px" className="mb-0.5 text-gray-400" />
          )}
        </div>
      ),
      disabled:
        !impactFields.length || !hasFields(allFields, viewableFields, 'Impact'),
      classes: classes,
      component: <ProjectImpact {...{ project, specificFields }} />,
    },
    {
      id: 'project-documentation',
      ariaControls: 'project-documentation',
      label: 'Documentation',
      component: <ProjectDocumentation {...{ projectFiles }} mode="view" />,
    },
    ...(project.version === 3
      ? [
          {
            id: 'project-approval',
            ariacontrols: 'project-approval',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">Approval</div>
                {approvalFields.length === 0 && (
                  <CircularProgress
                    size="20px"
                    className="mb-0.5 text-gray-400"
                  />
                )}
              </div>
            ),
            disabled:
              !approvalFields.length ||
              !hasFields(allFields, viewableFields, 'Approval'),
            classes: classes,
            component: (
              <ProjectApproval
                specificFields={approvalFields}
                {...{ project }}
              />
            ),
          },
        ]
      : []),
    ...(isNull(project.latest_project)
      ? [
          {
            id: 'project-related-projects-section',
            ariaControls: 'project-related-projects-section',
            label: 'Related projects',
            component: <ProjectRelatedProjects {...{ relatedProjects }} />,
          },
        ]
      : []),
    ...(isNull(project.latest_project)
      ? [
          {
            id: 'project-history-section',
            ariaControls: 'project-history-section',
            label: 'History',
            component: <ProjectHistory mode="view" project={project} />,
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
          {tabs.map(({ id, ariaControls, label, disabled, classes }) => (
            <Tab
              id={id}
              aria-controls={ariaControls}
              label={label}
              disabled={disabled}
              classes={classes}
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
          .map(({ component }) => component)}
      </div>
    </>
  )
}

export default ProjectView
