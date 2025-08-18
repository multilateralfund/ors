import { useEffect, useState } from 'react'

import { useGetAssociatedProjects } from './useGetAssociatedProjects'
import { ProjectTypeApi, RelatedProjectsType } from '../interfaces'

import { debounce, isNull } from 'lodash'

const useGetRelatedProjects = (project: ProjectTypeApi, mode: string) => {
  const [componentProjects, setComponentProjects] = useState<
    RelatedProjectsType[] | null
  >([])
  const [loadedComponentProjects, setLoadedComponentProjects] =
    useState<boolean>(false)
  const [associatedProjects, setAssociatedProjects] = useState<
    RelatedProjectsType[] | null
  >([])
  const [loadedAssociatedProjects, setLoadedAssociatedProjects] =
    useState<boolean>(false)

  const relatedProjects = [
    {
      title: 'Components',
      data: componentProjects,
      setData: setComponentProjects,
      loaded: loadedComponentProjects,
      setLoaded: setLoadedComponentProjects,
      queryParams: 'only_components',
      noResultsText: "This project doesn't have additional components.",
    },
    {
      title: 'Associated projects',
      data: associatedProjects,
      setData: setAssociatedProjects,
      loaded: loadedAssociatedProjects,
      setLoaded: setLoadedAssociatedProjects,
      queryParams: 'exclude_components',
      noResultsText: 'No associated projects available.',
    },
  ]

  const debouncedGetAssociatedProjects = debounce(() => {
    relatedProjects.map(({ setData, setLoaded, queryParams }) => {
      useGetAssociatedProjects(
        project.id,
        setData,
        setLoaded,
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
