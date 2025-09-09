'use client'

import { useContext, useMemo, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterpriseVersionsList from './PEnterpriseVersionsList'
import PEnterpriseView from './PEnterpriseView'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { useGetProjectEnterprise } from '../../hooks/useGetProjectEnterprise'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

const PEnterprisesViewWrapper = () => {
  const { canEditEnterprise, canViewProjects } = useContext(PermissionsContext)

  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data: projectData, error } = project ?? {}

  const enterprise = useGetProjectEnterprise(enterprise_id)
  const { data, loading } = enterprise

  const versions = useMemo(() => {
    if (!data) return []

    return data.status === 'Approved'
      ? data.pending_project_enterprises
      : [data.approved_project_enterprise]
  }, [data])

  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)

  if (
    !canViewProjects ||
    (project &&
      (error || (projectData && projectData.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (enterprise?.error) {
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
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <PageHeading>
                    <PageTitle
                      pageTitle="View project enterprise"
                      projectTitle={data.enterprise.name}
                    />
                  </PageHeading>
                  {versions.length > 0 && (
                    <PEnterpriseVersionsList
                      {...{ versions, showVersionsMenu, setShowVersionsMenu }}
                    />
                  )}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2.5">
                <CancelLinkButton
                  title="Cancel"
                  href={`/projects-listing/projects-enterprises/${project_id}`}
                />
                {canEditEnterprise && (
                  <CustomLink
                    className="border border-solid border-secondary px-4 py-2 shadow-none hover:border-primary"
                    href={`/projects-listing/projects-enterprises/${project_id}/edit/${enterprise_id}`}
                    color="secondary"
                    variant="contained"
                    size="large"
                    button
                  >
                    Edit
                  </CustomLink>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span>Status:</span>
              <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
                {data.status}
              </span>
            </div>
          </HeaderTitle>
          <PEnterpriseView enterprise={data} />
        </>
      )}
    </>
  )
}

export default PEnterprisesViewWrapper
