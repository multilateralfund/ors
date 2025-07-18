import { RelatedProjectsType } from '../interfaces'
import { api } from '@ors/helpers'

import { map } from 'lodash'

export const useGetProjectsForSubmission = async (
  id: number,
  setAssociatedProjects: (projects: RelatedProjectsType[] | null) => void,
  setLoaded: (loaded: boolean) => void,
  include_validation: boolean = false,
  include_project: boolean = false,
) => {
  try {
    setLoaded(false)

    const projects = await api(
      `/api/projects/v2/${id}/list_associated_projects/?only_components=true&include_validation=${include_validation}&include_project=${include_project}`,
    )

    const formattedProjects = map(projects, (project) => {
      const formattedErrors = project.errors
        ? Object.entries(project.errors).flatMap(([key, messages]) =>
            map(messages as string[], (message) => ({ [key]: message })),
          )
        : []

      return {
        ...project,
        errors: formattedErrors,
      }
    })

    setAssociatedProjects(formattedProjects)
  } catch (e) {
    console.error('Error at loading projects for submission')
    setAssociatedProjects(null)
  } finally {
    setLoaded(true)
  }
}
