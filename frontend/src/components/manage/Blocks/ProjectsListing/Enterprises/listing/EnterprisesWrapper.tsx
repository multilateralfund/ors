'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesFiltersWrapper from '../../ProjectsEnterprises/listing/PEnterprisesFiltersWrapper'
import EnterprisesTable from './EnterprisesTable'
import { CreateButton, RedirectBackButton } from '../../HelperComponents'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'

import { Redirect } from 'wouter'

export default function EnterprisesWrapper() {
  const { canViewEnterprises, canEditEnterprise } =
    useContext(PermissionsContext)

  const form = useRef<any>()

  const initialFilters = {
    offset: 0,
    limit: 100,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const enterprises = useGetEnterprises(initialFilters)
  const { loading, setParams } = enterprises

  if (!canViewEnterprises) {
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
          {canEditEnterprise && (
            <div className="ml-auto mt-auto flex items-center gap-2.5">
              <CreateButton
                title="Create enterprise"
                href="/projects-listing/enterprises/create"
              />
            </div>
          )}
        </div>
      </HeaderTitle>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <PEnterprisesFiltersWrapper
          type="enterprises"
          {...{
            filters,
            initialFilters,
            setFilters,
            setParams,
          }}
        />
        <EnterprisesTable {...{ enterprises }} />
      </form>
    </>
  )
}
