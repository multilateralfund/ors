'use client'

import { useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectView from './ProjectView'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { ProjectSpecificFields } from '../interfaces'
import { api } from '@ors/helpers'

import { useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project
  const { cluster_id, project_type_id, sector_id } = data || {}

  const { data: projectFiles } = useGetProjectFiles(project_id) as any

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  const fetchSpecificFields = async () => {
    try {
      const res = await api(
        `/api/project-cluster/${cluster_id}/type/${project_type_id}/sector/${sector_id}/fields/`,
      )
      setSpecificFields(res.fields || [])
    } catch (e) {
      console.error('Error at loading project specific fields')
    }
  }

  useEffect(() => {
    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields()
    } else setSpecificFields([])
  }, [cluster_id, project_type_id, sector_id])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="align-center flex justify-between">
              <PageHeading className="min-w-fit">{data.code}</PageHeading>
              {/* <CustomLink
                className="mb-4 h-10 text-nowrap px-4 py-2 text-lg uppercase"
                href={`/projects-listing/${project_id}/edit`}
                color="secondary"
                variant="contained"
                button
              >
                Edit
              </CustomLink> */}
            </div>
          </HeaderTitle>
          <ProjectView project={data} {...{ projectFiles, specificFields }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
