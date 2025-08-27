import { useEffect, useState } from 'react'

import { useGetAssociatedProjects } from './useGetAssociatedProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'

import { debounce, isNull } from 'lodash'

const useGetRelatedProjects = (project: ProjectTypeApi, mode: string) => {
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
      title: 'Associated projects',
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
  }, [])

  return relatedProjects
}

export default useGetRelatedProjects
