'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesFiltersWrapper from './PEnterprisesFiltersWrapper'
import PEnterprisesTable from './PEnterprisesTable'
import { PageTitle, RedirectBackButton } from '../../HelperComponents'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'
import { useGetProject } from '../../hooks/useGetProject'

import { IoAddCircle } from 'react-icons/io5'
import { Redirect, useParams } from 'wouter'
import { FiEdit } from 'react-icons/fi'
import { Button } from '@mui/material'

export default function PEnterprisesWrapper() {
  const form = useRef<any>()

  const { canEditEnterprise, canViewProjects } = useContext(PermissionsContext)

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

  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

  if (
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
                  pageTitle="Project enterprises information for"
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
              <CancelLinkButton
                title="Cancel"
                href="/projects-listing/projects-enterprises"
              />
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
          {project_id && canEditEnterprise && (
            <div className="mb-auto flex gap-2">
              <Link
                className="no-underline"
                href={`/projects-listing/projects-enterprises/${project_id}/create`}
              >
                <Button
                  className="h-fit border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none"
                  variant="contained"
                  size="large"
                >
                  Add project enterprise
                  <IoAddCircle className="ml-1.5" size={20} />
                </Button>
              </Link>
              <Link
                className="p-0 no-underline"
                href={`/projects-listing/projects-enterprises/${project_id}/edit/${enterpriseId}`}
                disabled={!enterpriseId}
                button
              >
                <Button
                  className="h-fit border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!enterpriseId}
                  variant="contained"
                  size="large"
                >
                  Edit project enterprise
                  <FiEdit className="ml-1.5" size={18} />
                </Button>
              </Link>
            </div>
          )}
        </div>
        <PEnterprisesTable
          {...{ enterprises, filters }}
          {...(project_id && { enterpriseId, setEnterpriseId })}
        />
      </form>
    </>
  )
}
