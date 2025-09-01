'use client'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageTitle, RedirectBackButton } from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

export default function PEnterprisesWrapper() {
  const { project_id } = useParams<Record<string, string>>()

  const project = project_id ? useGetProject(project_id) : undefined
  const { data, error, loading } = project ?? {}

  if (project && (error || (data && data.submission_status !== 'Approved'))) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!!project_id && loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-col">
            <RedirectBackButton />
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <PageHeading>
                {project && data ? (
                  <PageTitle
                    pageTitle="Enterprises information for"
                    projectTitle={data.code ?? data.code_legacy}
                  />
                ) : (
                  <span className="font-medium text-[#4D4D4D]">
                    Enterprises
                  </span>
                )}
              </PageHeading>
            </div>
          </div>
        </div>
      </HeaderTitle>
    </>
  )
}
