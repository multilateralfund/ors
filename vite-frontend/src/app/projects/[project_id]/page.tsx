import { ProjectType } from '@ors/types/api_projects'

import { Metadata } from 'next'

import PView from '@ors/components/manage/Blocks/Projects/PView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

type ProjectProps = {
  params: {
    project_id: string
  }
}

export async function generateMetadata({
  params,
}: ProjectProps): Promise<Metadata> {
  const data = await api(`api/projects/${params.project_id}/`, {}, false)

  return {
    description: data.description,
    title: data.title,
  }
}

export default async function Project({ params }: ProjectProps) {
  const data = await api<ProjectType>(
    `api/projects/${params.project_id}/`,
    {},
    false,
  )

  return (
    <PageWrapper>
      <PView data={data!} />
    </PageWrapper>
  )
}
