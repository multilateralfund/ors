'use client'

import { useEffect, useMemo, useState } from 'react'

import ProjectHistory from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectHistory.tsx'
import ProjectIdentifiers from './ProjectIdentifiers'
import ProjectCrossCutting from './ProjectCrossCutting'
import ProjectSpecificInfo from './ProjectSpecificInfo'
import ProjectApproval from './ProjectApproval'
import ProjectImpact from './ProjectImpact'
import ProjectDocumentation from './ProjectDocumentation'
import { ProjectFile, ProjectViewProps } from '../interfaces'
import { getSectionFields, hasFields } from '../utils'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoDownloadOutline } from 'react-icons/io5'
import { Tabs, Tab, Tooltip } from '@mui/material'
import { debounce } from 'lodash'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'

import useClickOutside from '@ors/hooks/useClickOutside'

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
}: ProjectViewProps & { projectFiles: ProjectFile[] }) => {
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

  const classes = {
    disabled: 'text-gray-200',
  }

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
          <Tab
            id="project-identifiers"
            aria-controls="project-identifiers"
            label="Identifiers"
          />
          <Tab
            id="project-cross-cutting"
            aria-controls="project-cross-cutting"
            label="Cross-Cutting"
            disabled={!hasFields(allFields, viewableFields, 'Cross-Cutting')}
            classes={classes}
          />
          <Tab
            id="project-specific-info"
            aria-controls="project-specific-info"
            label="Specific Information"
            disabled={
              (!substanceDetailsFields.length && !overviewFields.length) ||
              (!hasFields(allFields, viewableFields, 'Header') &&
                !hasFields(allFields, viewableFields, 'Substance Details'))
            }
            classes={classes}
          />
          <Tab
            id="project-impact"
            aria-controls="project-impact"
            label="Impact"
            disabled={
              !impactFields.length ||
              !hasFields(allFields, viewableFields, 'Impact')
            }
            classes={classes}
          />
          <Tab
            id="project-documentation"
            aria-controls="project-documentation"
            label="Documentation"
          />
          <Tab
            id="project-history-section"
            aria-controls="project-history-section"
            label="History"
          />
          {project.version > 2 && (
            <Tab
              id="project-approval"
              aria-controls="project-approval"
              label="Approval"
              disabled={!hasFields(allFields, viewableFields, 'Approval')}
              classes={classes}
            />
          )}
        </Tabs>
        <div>
          <div className="flex items-center justify-between gap-x-2">
            <ProjectDownloads project={project} />
          </div>
        </div>
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 && (
          <ProjectIdentifiers {...{ project, specificFields }} />
        )}
        {activeTab === 1 && <ProjectCrossCutting {...{ project }} />}
        {activeTab === 2 && (
          <ProjectSpecificInfo {...{ project, specificFields }} />
        )}
        {activeTab === 3 && <ProjectImpact {...{ project, specificFields }} />}
        {activeTab === 4 && (
          <ProjectDocumentation {...{ projectFiles }} mode="view" />
        )}
        {activeTab === 5 && <ProjectHistory mode={'view'} project={project} />}
        {activeTab === 6 && <ProjectApproval {...{ project }} />}
      </div>
    </>
  )
}

export default ProjectView
