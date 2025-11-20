import { useEffect, useState } from 'react'

import { useGetAssociatedProjects } from './useGetAssociatedProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'

import { debounce, isNull } from 'lodash'
import { formatApiUrl } from '@ors/helpers'
import Link from '@ors/components/ui/Link/Link.tsx'

const useGetRelatedProjects = (
  project: ProjectTypeApi,
  mode: string,
  metaProjectId: number | null,
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
      noResultsText: "This project doesn't have additional components.",
    },
    {
      title: (
        <span className="flex items-center justify-between">
          <span>Associated projects</span>
          <Link
            className="border-primary bg-secondary font-bold text-white hover:bg-primary hover:text-mlfs-hlYellow"
            href={formatApiUrl(
              `/api/projects/v2/export_associated_projects?project_id=${project.id}`,
            )}
            button
          >
            Download associated projects
          </Link>
        </span>
      ),
      data: associatedProjectsAssociation,
      setData: setassociatedProjectsAssociation,
      queryParams: 'exclude_components',
      noResultsText: 'No associated projects available.',
    },
  ]

  const debouncedGetAssociatedProjects = debounce(() => {
    relatedProjects.map(({ setData, queryParams }) => {
      useGetAssociatedProjects(
        project.id,
        setData,
        queryParams,
        false,
        false,
        false,
      )
    })
  }, 0)

  useEffect(() => {
    if (
      (mode === 'edit' || mode === 'view') &&
      isNull(project.latest_project)
    ) {
      debouncedGetAssociatedProjects()
    }
  }, [metaProjectId])

  return relatedProjects
}

export default useGetRelatedProjects
