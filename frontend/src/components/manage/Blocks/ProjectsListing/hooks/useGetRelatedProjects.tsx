import { useEffect, useState } from 'react'

import { useGetAssociatedProjects } from './useGetAssociatedProjects'
import { ProjectTypeApi, RelatedProjectsType } from '../interfaces'

import { debounce } from 'lodash'

const useGetRelatedProjects = (project: ProjectTypeApi, mode: string) => {
  const [componentProjects, setComponentProjects] = useState<
    RelatedProjectsType[] | null
  >([])
  const [associatedProjects, setAssociatedProjects] = useState<
    RelatedProjectsType[] | null
  >([])

  const relatedProjects = [
    {
      title: 'Components',
      data: componentProjects,
      setData: setComponentProjects,
      queryParams: 'only_components',
    },
    {
      title: 'Associated projects',
      data: associatedProjects,
      setData: setAssociatedProjects,
      queryParams: 'exclude_components',
    },
  ]

  const debouncedGetAssociatedProjects = debounce(() => {
    relatedProjects.map(({ setData, queryParams }) => {
      useGetAssociatedProjects(
        project.id,
        setData,
        undefined,
        queryParams,
        false,
        false,
        false,
      )
    })
  }, 0)

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      debouncedGetAssociatedProjects()
    }
  }, [])

  return relatedProjects
}

export default useGetRelatedProjects
