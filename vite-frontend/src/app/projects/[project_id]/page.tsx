import { useState, useEffect } from 'react'
import { ProjectType } from '@ors/types/api_projects'

import { useParams } from 'wouter'

import PView from '@ors/components/manage/Blocks/Projects/PView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

// type ProjectProps = {
//   params: {
//     project_id: string
//   }
// }

// export function generateMetadata({
//   params,
// }: ProjectProps): Promise<Metadata> {
//   const data = await api(`api/projects/${params.project_id}/`, {}, false)
//
//   return {
//     description: data.description,
//     title: data.title,
//   }
// }

function useProject(project_id: string) {
  const [projects, setProjects] = useState<ProjectType | null>(null)

  async function fetchProjects() {
    const resp = await api<ProjectType>(
      `api/projects/${project_id}/`,
      {},
      false,
    ) || null
    setProjects(resp)
  }

  useEffect(function(){
    fetchProjects()
  }, [])

  return projects
}

export default function Project() {
  const { project_id } = useParams()
  const data = useProject(project_id)
  return (
    <PageWrapper>
      { data ? <PView data={data!} /> : null }
    </PageWrapper>
  )
}
