'use client'

import { useContext, useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectIdentifiers from '../ProjectView/ProjectIdentifiers'
import ProjectCrossCutting from '../ProjectView/ProjectCrossCutting'
import ProjectSpecificInfo from '../ProjectView/ProjectSpecificInfo'
import ProjectViewButtons from './ProjectViewButtons'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectSpecificFields, ProjectTypeApi } from '../interfaces'
import { useStore } from '@ors/store'

import { Divider, Popover, CircularProgress } from '@mui/material'
import { debounce } from 'lodash'
import cx from 'classnames'

const ProjectData = ({
  project,
  setParams,
}: {
  project: ProjectTypeApi
  setParams: any
}) => {
  const { id, title, submission_status, code, code_legacy } = project

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
    debouncedFetchProjectFields()
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
    <>
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
        {data && (
          <ProjectViewButtons {...{ data, specificFields, setParams }} />
        )}
      </div>
      {loading && (
        <CircularProgress color="inherit" size="30px" className="mt-6" />
      )}
      {data && !loading && (
        <div className="mt-6">
          <ProjectIdentifiers project={data} isListingView={true} />
          <Divider className="my-6" />
          <ProjectCrossCutting project={data} />
          <Divider className="my-6" />
          <ProjectSpecificInfo project={data} {...{ specificFields }} />
        </div>
      )}
    </>
  )
}

export default function ProjectCard({
  project,
  setParams,
}: {
  project: ProjectTypeApi
  setParams: any
}) {
  const { canViewProjects } = useContext(PermissionsContext)

  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null)

  const open = Boolean(anchorEl)
  const ariaDescribedBy = open ? 'popover-project' : undefined

  const openPopover = (event: MouseEvent<HTMLInputElement>) => {
    if (canViewProjects) {
      event.preventDefault()
      setAnchorEl(event.currentTarget)
    }
  }

  const closePopover = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <div
        className={cx(
          'ml-2 cursor-pointer overflow-hidden truncate whitespace-nowrap text-inherit underline',
          {
            'no-underline': !canViewProjects,
          },
        )}
        onClick={openPopover}
      >
        {project.title}
      </div>

      <Popover
        id={ariaDescribedBy}
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            className: cx(
              'overflow-auto mt-2 p-3 rounded-lg border-2 border-solid border-primary bg-white shadow-xl pb-1',
            ),
            style: {
              width: 'auto',
              minWidth: '15rem',
              maxHeight: '50vh',
              maxWidth: '90%',
            },
          },
        }}
        onClose={closePopover}
        disableScrollLock
      >
        <ProjectData {...{ project, setParams }} />
      </Popover>
    </>
  )
}
