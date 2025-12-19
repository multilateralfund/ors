'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterprisesFiltersWrapper from '../../Enterprises/listing/EnterprisesFiltersWrapper'
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

  const initialFilters = {
    offset: 0,
    limit: 100,
    project_id: project_id,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const enterprises = useGetProjectEnterprises(initialFilters)
  const { loading, setParams } = enterprises

  if (
    !canViewProjects ||
    !canViewEnterprises ||
    !canEditProjectEnterprise ||
    (project && (error || (data && data.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects/listing" />
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
                pageTitle="Enterprises for project"
                projectTitle={data?.code ?? data?.code_legacy}
                className="break-all"
              />
            </PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <EnterprisesFiltersWrapper
            {...{
              filters,
              initialFilters,
              setFilters,
              setParams,
            }}
          />
          {canEditProjectEnterprise && (
            <div className="ml-auto mt-auto flex items-center">
              <CreateButton
                title="Add project enterprise"
                href={`/projects/projects-enterprises/${project_id}/create`}
                className="!mb-0"
              />
            </div>
          )}
        </div>
        <PEnterprisesTable {...{ enterprises }} />
      </form>
    </>
  )
}
