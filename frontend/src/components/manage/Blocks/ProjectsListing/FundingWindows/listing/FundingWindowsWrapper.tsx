import { useContext, useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterprisesFiltersWrapper from './EnterprisesFiltersWrapper'
import EnterprisesTable from './EnterprisesTable'
import { CreateButton, RedirectBackButton } from '../../HelperComponents'
import { useGetFundingWindows } from '../../hooks/useGetFundingWindows'

import { Redirect } from 'wouter'

export default function FundingWindowsWrapper() {
  const { canViewFundingWindows, canEditFundingWindows } =
    useContext(PermissionsContext)

  const form = useRef<any>()

  const initialFilters = {
    offset: 0,
    limit: 100,
  }
  const [filters, setFilters] = useState(initialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const fundindWindows = useGetFundingWindows(initialFilters)
  const { loading, setParams } = fundindWindows

  if (!canViewFundingWindows) {
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
                Funding windows
              </span>
            </PageHeading>
          </div>
          {canEditFundingWindows && (
            <div className="ml-auto mt-auto flex items-center">
              <CreateButton
                title="Create new funding window"
                href="/projects-listing/funding-windows/create"
                className="!mb-0"
              />
            </div>
          )}
        </div>
      </HeaderTitle>
      {/* <form className="flex flex-col gap-6" ref={form} key={key}>
        <EnterprisesFiltersWrapper
          {...{
            filters,
            initialFilters,
            setFilters,
            setParams,
          }}
        />
        <EnterprisesTable {...{ fundindWindows }} />
      </form> */}
    </>
  )
}
