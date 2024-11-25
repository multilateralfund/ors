import { ProjectType } from '@ors/types/api_projects'

import { Metadata } from 'next'

import PSView from '@ors/components/manage/Blocks/ProjectSubmissions/PSView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

type ProjectSubmissionProps = {
  params: {
    submission_id: string
  }
}

export async function generateMetadata({
  params,
}: ProjectSubmissionProps): Promise<Metadata> {
  const data = await api(`api/projects/${params.submission_id}/`, {}, false)

  return {
    description: data.description,
    title: data.title,
  }
}

export default async function ProjectSubmission({
  params,
}: ProjectSubmissionProps) {
  const data = await api<ProjectType>(
    `api/projects/${params.submission_id}/`,
    {},
    false,
  )

  return (
    <PageWrapper>
      <PSView data={data!} />
    </PageWrapper>
  )
}
