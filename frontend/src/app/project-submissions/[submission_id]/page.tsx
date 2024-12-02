import { useEffect, useState } from 'react'
import { ProjectType } from '@ors/types/api_projects'

import { useParams } from 'wouter'

import PSView from '@ors/components/manage/Blocks/ProjectSubmissions/PSView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

function useProject(submission_id: string) {
  const [projects, setProjects] = useState<ProjectType | null>(null)

  useEffect(
    function () {
      async function fetchProjects() {
        const resp =
          (await api<ProjectType>(
            `api/projects/${submission_id}/`,
            {},
            false,
          )) || null
        setProjects(resp)
      }
      fetchProjects()
    },
    [submission_id],
  )

  return projects
}

// export async function generateMetadata({
//   params,
// }: ProjectSubmissionProps): Promise<Metadata> {
//   const data = await api(`api/projects/${params.submission_id}/`, {}, false)
//
//   return {
//     description: data.description,
//     title: data.title,
//   }
// }

export default function ProjectSubmission() {
  const { submission_id } = useParams<Record<string, string>>()
  const data = useProject(submission_id)
  return <PageWrapper>{data ? <PSView data={data!} /> : null}</PageWrapper>
}
