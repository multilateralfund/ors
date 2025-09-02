'use client'

import { useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PEnterprisesFiltersWrapper from './PEnterprisesFiltersWrapper'
import PEnterprisesTable from './PEnterprisesTable'
import { PageTitle, RedirectBackButton } from '../HelperComponents'
import { useGetEnterpriseStatuses } from '../hooks/useGetEnterpriseStatuses'
import { useGetEnterprises } from '../hooks/useGetEnterprises'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { map } from 'lodash'

export default function PEnterprisesWrapper() {
  const { project_id } = useParams<Record<string, string>>()

  const form = useRef<any>()

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

  const statuses = useGetEnterpriseStatuses()
  const enterpriseStatuses = map(statuses, (status) => ({
    id: status[0],
    label: status[1],
    name: status[1],
  }))

  if (project && (error || (data && data.submission_status !== 'Approved'))) {
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
        </div>
        <PEnterprisesTable {...{ enterprises, filters }} />
      </form>
    </>
  )
}
