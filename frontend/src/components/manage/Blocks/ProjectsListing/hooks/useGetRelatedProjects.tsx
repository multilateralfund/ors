import { useEffect, useState } from 'react'

import Link from '@ors/components/ui/Link/Link.tsx'
import { useGetAssociatedProjects } from './useGetAssociatedProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { debounce, isNull, map } from 'lodash'

const useGetRelatedProjects = (
  mode: string,
  metaProjectId: number | null,
  refetchRelatedProjects: boolean,
  project?: ProjectTypeApi,
) => {
  const [componentAssociation, setComponentAssociation] =
    useState<AssociatedProjectsType>({
      projects: [],
      loaded: false,
    })
  const [associatedProjectsAssociation, setassociatedProjectsAssociation] =
    useState<AssociatedProjectsType>({
      projects: [],
      loaded: false,
    })

  const relatedProjects = [
    {
      title: 'Components',
      data: componentAssociation,
      setData: setComponentAssociation,
      queryParams: 'only_components',
      only_approved: false,
      noResultsText: "This project doesn't have additional components.",
    },
    {
      title: 'Associated projects',
      downloadButton: (
        <Link
          className="border-primary bg-primary font-bold text-white hover:bg-primary hover:text-mlfs-hlYellow"
          href={formatApiUrl(
            `/api/projects/v2/export_associated_projects?project_id=${project?.id}`,
          )}
          button
        >
          Download associated projects
        </Link>
      ),
      data: associatedProjectsAssociation,
      setData: setassociatedProjectsAssociation,
      queryParams: 'exclude_components',
      only_approved: true,
      noResultsText: 'No associated projects available.',
    },
  ]

  const debouncedGetAssociatedProjects = debounce(() => {
    if (!project) {
      return
    }

    relatedProjects.map(({ setData, queryParams, only_approved }) => {
      useGetAssociatedProjects(
        project.id,
        setData,
        queryParams,
        false,
        false,
        false,
        only_approved,
      )
    })
  }, 0)

  useEffect(() => {
    if (
      !!project &&
      (mode === 'edit' || mode === 'view') &&
      isNull(project.latest_project)
    ) {
      debouncedGetAssociatedProjects()
    }
  }, [metaProjectId, refetchRelatedProjects])

  if (!['edit', 'view'].includes(mode)) {
    return map(relatedProjects, (project) => ({
      ...project,
      data: { projects: [], loaded: true },
    }))
  }

  return relatedProjects
}

export default useGetRelatedProjects
