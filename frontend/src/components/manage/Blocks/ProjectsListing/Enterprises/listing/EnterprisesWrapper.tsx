import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterprisesFiltersWrapper from './EnterprisesFiltersWrapper'
import EnterprisesTable from './EnterprisesTable'
import { CreateButton, RedirectBackButton } from '../../HelperComponents'
import { useGetEnterprises } from '../../hooks/useGetEnterprises'
import { formatApiUrl } from '@ors/helpers'
import Link from '@ors/components/ui/Link/Link'

import { Redirect } from 'wouter'

export default function EnterprisesWrapper() {
  const { canViewEnterprises, canEditEnterprise } =
    useContext(PermissionsContext)

  const downloadUrlBase = '/api/enterprises/export'

  const form = useRef<any>()

  const initialFilters = {
    offset: 0,
    limit: 100,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const enterprises = useGetEnterprises(initialFilters)
  const { loading, params, setParams } = enterprises

  const downloadUrl = useMemo(() => {
    const encodedParams = new URLSearchParams(params).toString()
    return formatApiUrl(`${downloadUrlBase}?${encodedParams}`)
  }, [filters])

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
              <span className="font-medium text-[#4D4D4D]">
                Manage enterprises
              </span>
            </PageHeading>
          </div>
          {canEditEnterprise && (
            <div className="ml-auto mt-auto flex items-center">
              <CreateButton
                title="Create enterprise"
                href="/projects-listing/enterprises/create"
                className="!mb-0"
              />
            </div>
          )}
        </div>
      </HeaderTitle>
      <form className="flex flex-col gap-6" ref={form} key={key}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EnterprisesFiltersWrapper
            mode="listing"
            {...{
              form,
              filters,
              initialFilters,
              setFilters,
              setParams,
            }}
          />
          {canEditEnterprise && (
            <Link
              className="mb-auto px-4 py-2 text-lg uppercase md:mb-0.5"
              color="secondary"
              href={downloadUrl}
              variant="contained"
              button
              download
            >
              Export enterprises
            </Link>
          )}
        </div>
        <EnterprisesTable {...{ enterprises }} />
      </form>
    </>
  )
}
