'use client'

import { useContext, useRef } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesTable from './PEnterprisesTable'
import {
  CreateButton,
  PageTitle,
  RedirectBackButton,
} from '../../HelperComponents'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

export default function PEnterprisesWrapper() {
  const { canViewProjects, canViewEnterprises, canEditProjectEnterprise } =
    useContext(PermissionsContext)

  const form = useRef<any>()

  const { project_id } = useParams<Record<string, string>>()
  const project = useGetProject(project_id)
  const { data, error, loading: loadingProject } = project ?? {}

  const params = {
    offset: 0,
    limit: 100,
    project_id: project_id,
  }
  const enterprises = useGetProjectEnterprises(params)
  const { loading } = enterprises

  if (
    !canViewEnterprises ||
    !canViewProjects ||
    (project && (error || (data && data.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || loadingProject}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-col">
            <RedirectBackButton />
            <PageHeading>
              <PageTitle
                pageTitle="Project enterprises of"
                projectTitle={data?.code ?? data?.code_legacy}
                className="break-all"
              />
            </PageHeading>
          </div>
          {canEditProjectEnterprise && (
            <div className="ml-auto mt-auto flex items-center gap-2.5">
              <CreateButton
                title="Add project enterprise"
                href={`/projects-listing/projects-enterprises/${project_id}/create`}
                className="!mb-0"
              />
            </div>
          )}
        </div>
      </HeaderTitle>
      <form ref={form}>
        <PEnterprisesTable {...{ enterprises }} />
      </form>
    </>
  )
}
