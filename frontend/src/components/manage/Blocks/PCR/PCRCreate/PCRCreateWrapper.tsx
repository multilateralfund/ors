import PCRHeader from '../PCRSubmission/PCRHeader'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'

import { useParams } from 'wouter'

const PCRCreateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()
  const { results: metaproject = [] } = useGetPCRProjects({ project_id })

  return (
    <>
      <PCRHeader mode="add" />
    </>
  )
}

export default PCRCreateWrapper
