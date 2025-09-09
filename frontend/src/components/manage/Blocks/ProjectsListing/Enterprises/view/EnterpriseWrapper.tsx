'use client'

import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterpriseView from './EnterpriseView'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { useGetEnterprise } from '../../hooks/useGetEnterprise'

import { Redirect, useParams } from 'wouter'

const EnterpriseWrapper = () => {
  const { canViewProjects } = useContext(PermissionsContext)

  const { enterprise_id } = useParams<Record<string, string>>()
  const enterprise = useGetEnterprise(enterprise_id)
  const { data, loading } = enterprise

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (enterprise?.error) {
    return <Redirect to="/projects-listing/enterprises" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-col">
                <RedirectBackButton />
                <PageHeading>
                  <PageTitle
                    pageTitle="View enterprise"
                    projectTitle={data.name}
                  />
                </PageHeading>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2.5">
                <CancelLinkButton
                  title="Cancel"
                  href="/projects-listing/enterprises"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span>Status:</span>
              <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
                {data.status}
              </span>
            </div>
          </HeaderTitle>
          <EnterpriseView enterprise={data} />
        </>
      )}
    </>
  )
}

export default EnterpriseWrapper
