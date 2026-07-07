import { useEffect } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'

import { useParams } from 'wouter'

const PCRCreateWrapper = () => {
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  const { project_id } = useParams<Record<string, string>>()
  const { results: metaproject = [] } = useGetPCRProjects({ project_id })

  useVisibilityChange(updatedFields.size > 0)

  return (
    <>
      <PCRHeader mode="add" />
      <PCRForm />
    </>
  )
}

export default PCRCreateWrapper
