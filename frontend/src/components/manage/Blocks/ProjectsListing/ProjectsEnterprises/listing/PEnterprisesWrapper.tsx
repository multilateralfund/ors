'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesFiltersWrapper from './PEnterprisesFiltersWrapper'
import PEnterprisesTable from './PEnterprisesTable'
import { PageTitle, RedirectBackButton } from '../../HelperComponents'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

export default function PEnterprisesWrapper() {
  const { canViewProjects, canViewEnterprises, canEditProjectEnterprise } =
    useContext(PermissionsContext)

  const form = useRef<any>()

  const { project_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data, error, loading: loadingProject } = project ?? {}

  const initialFilters = {
    offset: 0,
    limit: 100,
    project_id: project_id ?? null,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const enterprises = useGetProjectEnterprises(initialFilters)
  const { loading, setParams } = enterprises

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
        active={loading || (!!project_id && loadingProject)}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-col">
            <RedirectBackButton />
            <PageHeading>
              {project && data ? (
                <PageTitle
                  pageTitle="Project enterprises of"
                  projectTitle={data.code ?? data.code_legacy}
                />
              ) : (
                <span className="font-medium text-[#4D4D4D]">
                  Projects enterprises
                </span>
              )}
            </PageHeading>
          </div>
          <div className="ml-auto mt-auto flex items-center gap-2.5">
            {project_id && (
              <CustomLink
                className="border border-solid border-secondary px-4 py-2 shadow-none hover:border-primary"
                href="/projects-listing/projects-enterprises"
                color="secondary"
                variant="contained"
                size="large"
                button
              >
                View all project enterprises
              </CustomLink>
            )}
          </div>
        </div>
      </HeaderTitle>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PEnterprisesFiltersWrapper
            type="project-enterprises"
            {...{
              filters,
              initialFilters,
              setFilters,
              setParams,
            }}
          />
          {project_id && canEditProjectEnterprise && (
            <CustomLink
              className="h-10 border border-solid border-secondary px-4 py-2 shadow-none hover:border-primary"
              href={`/projects-listing/projects-enterprises/${project_id}/create`}
              color="secondary"
              variant="contained"
              size="large"
              button
            >
              Add project enterprise
            </CustomLink>
          )}
        </div>
        <PEnterprisesTable {...{ enterprises }} />
      </form>
    </>
  )
}
