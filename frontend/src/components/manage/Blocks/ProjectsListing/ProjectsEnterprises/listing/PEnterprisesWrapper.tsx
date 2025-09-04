'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Link from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesFiltersWrapper from './PEnterprisesFiltersWrapper'
import PEnterprisesTable from './PEnterprisesTable'
import { PageTitle, RedirectBackButton } from '../../HelperComponents'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'
import { useGetProject } from '../../hooks/useGetProject'

import { IoAddCircle } from 'react-icons/io5'
import { Redirect, useParams } from 'wouter'
import { FiEdit } from 'react-icons/fi'
import { Button } from '@mui/material'
import { map } from 'lodash'

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

  const enterprises = useGetEnterprises(initialFilters)
  const { loading, setParams } = enterprises

  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

  const statuses = useGetEnterpriseStatuses()
  const enterpriseStatuses = map(statuses, (status) => ({
    id: status[0],
    label: status[1],
    name: status[1],
  }))

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
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap justify-between gap-x-10 gap-y-4">
          <PEnterprisesFiltersWrapper
            {...{
              enterpriseStatuses,
              filters,
              initialFilters,
              setFilters,
              setParams,
            }}
          />
          {project_id && canEditEnterprise && (
            <div className="flex gap-2">
              <Link
                className="no-underline"
                href={`/projects-listing/enterprises/${project_id}/create`}
              >
                <Button
                  className="h-fit border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none"
                  variant="contained"
                  size="large"
                >
                  Add enterprise <IoAddCircle className="ml-1.5" size={20} />
                </Button>
              </Link>
              <Link
                className="p-0 no-underline"
                href={`/projects-listing/enterprises/${project_id}/edit/${enterpriseId}`}
                disabled={!enterpriseId}
                button
              >
                <Button
                  className="h-fit border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!enterpriseId}
                  variant="contained"
                  size="large"
                >
                  Edit enterprise <FiEdit className="ml-1.5" size={18} />
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
