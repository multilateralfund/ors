'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesFiltersWrapper from '../../ProjectsEnterprises/listing/PEnterprisesFiltersWrapper'
import EnterprisesTable from './EnterprisesTable'
import { RedirectBackButton } from '../../HelperComponents'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'

import { Redirect } from 'wouter'
import { map } from 'lodash'

export default function EnterprisesWrapper() {
  const form = useRef<any>()

  const { canViewProjects } = useContext(PermissionsContext)

  const initialFilters = {
    offset: 0,
    limit: 100,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const enterprises = useGetEnterprises(null, initialFilters)
  const { loading, setParams } = enterprises

  const statuses = useGetEnterpriseStatuses()
  const enterpriseStatuses = map(statuses, (status) => ({
    id: status[0],
    label: status[1],
    name: status[1],
  }))

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-col">
            <RedirectBackButton />
            <PageHeading>
              <span className="font-medium text-[#4D4D4D]">Enterprises</span>
            </PageHeading>
          </div>
          <div className="ml-auto mt-auto flex items-center gap-2.5">
            <CancelLinkButton
              title="Cancel"
              href="/projects-listing/projects-enterprises"
            />
          </div>
        </div>
      </HeaderTitle>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <PEnterprisesFiltersWrapper
          type="enterprises"
          {...{
            enterpriseStatuses,
            filters,
            initialFilters,
            setFilters,
            setParams,
          }}
        />
        <EnterprisesTable {...{ enterprises, filters }} />
      </form>
    </>
  )
}
