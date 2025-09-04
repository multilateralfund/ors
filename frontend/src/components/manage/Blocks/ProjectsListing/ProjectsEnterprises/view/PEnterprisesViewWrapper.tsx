'use client'

import { useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterpriseView from './PEnterpriseView'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { useGetEnterprise } from '../../hooks/useGetEnterprise'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

const PEnterprisesViewWrapper = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data: projectData, error } = project ?? {}

  const enterprise = useGetEnterprise(enterprise_id)
  const { data, loading } = enterprise

  if (
    project &&
    (error || (projectData && projectData.submission_status !== 'Approved'))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (enterprise?.error) {
    return <Redirect to={`/projects-listing/enterprises/${project_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-col">
                <RedirectBackButton />
                <PageHeading>
                  <PageTitle
                    pageTitle="View enterprise"
                    projectTitle={data.enterprise}
                  />
                </PageHeading>
              </div>
              {canEditEnterprise && (
                <CustomLink
                  className="ml-auto mt-auto h-10 text-nowrap px-4 py-2 text-lg uppercase"
                  href={`/projects-listing/enterprises/${project_id}/edit/${enterprise_id}`}
                  color="secondary"
                  variant="contained"
                  button
                >
                  Edit
                </CustomLink>
              )}
            </div>
          </HeaderTitle>
          <PEnterpriseView enterprise={data} />
        </>
      )}
    </>
  )
}

export default PEnterprisesViewWrapper
