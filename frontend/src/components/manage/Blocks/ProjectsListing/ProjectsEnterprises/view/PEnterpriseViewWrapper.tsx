'use client'

import { useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterpriseView from './PEnterpriseView'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { EnterpriseStatus } from '../FormHelperComponents'
import { useGetProjectEnterprise } from '../../hooks/useGetProjectEnterprise'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

const PEnterpriseViewWrapper = () => {
  const {
    canViewProjects,
    canViewEnterprises,
    canEditProjectEnterprise,
    canApproveProjectEnterprise,
  } = useContext(PermissionsContext)

  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data: projectData, error: projectError } = project ?? {}

  const enterprise = useGetProjectEnterprise(enterprise_id)
  const { data, loading, error } = enterprise

  if (!canViewEnterprises || !canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    !project_id ||
    (project &&
      (projectError ||
        (projectData && projectData.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/projects-enterprises" />
  }

  if (error) {
    return (
      <Redirect to={`/projects-listing/projects-enterprises/${project_id}`} />
    )
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
                    pageTitle="View project enterprise"
                    projectTitle={data.enterprise.name}
                  />
                </PageHeading>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2.5">
                <CancelLinkButton
                  title="Cancel"
                  href={`/projects-listing/projects-enterprises/${project_id}`}
                />
                {(canEditProjectEnterprise || canApproveProjectEnterprise) &&
                  data.status !== 'Obsolete' &&
                  !(
                    data.status === 'Approved' && !canApproveProjectEnterprise
                  ) && (
                    <CustomLink
                      className="border border-solid border-secondary px-4 py-2 shadow-none hover:border-primary"
                      href={`/projects-listing/projects-enterprises/${project_id}/edit/${enterprise_id}`}
                      color="secondary"
                      variant="contained"
                      size="large"
                      button
                    >
                      Edit project enterprise
                    </CustomLink>
                  )}
              </div>
            </div>
            <EnterpriseStatus status={data.status} />
          </HeaderTitle>
          <PEnterpriseView enterprise={data} />
        </>
      )}
    </>
  )
}

export default PEnterpriseViewWrapper
