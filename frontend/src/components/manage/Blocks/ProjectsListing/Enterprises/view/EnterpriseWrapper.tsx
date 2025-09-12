'use client'

import { useContext } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterpriseView from './EnterpriseView'
import { RedirectBackButton, PageTitle } from '../../HelperComponents'
import { EnterpriseStatus } from '../FormHelperComponents'
import { useGetEnterprise } from '../../hooks/useGetEnterprise'

import { Redirect, useParams } from 'wouter'

const EnterpriseWrapper = () => {
  const { canViewEnterprises, canEditEnterprise } =
    useContext(PermissionsContext)

  const { enterprise_id } = useParams<Record<string, string>>()
  const enterprise = useGetEnterprise(enterprise_id)
  const { data, loading, error } = enterprise

  if (!canViewEnterprises) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (error) {
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
                {canEditEnterprise && (
                  <CustomLink
                    href={`/projects-listing/enterprises/${enterprise_id}/edit`}
                    className="border border-solid px-4 py-2 hover:border-primary"
                    variant="contained"
                    color="secondary"
                    size="large"
                    button
                  >
                    Edit enterprise
                  </CustomLink>
                )}
              </div>
            </div>
            <EnterpriseStatus status={data.status} />
          </HeaderTitle>
          <EnterpriseView enterprise={data} />
        </>
      )}
    </>
  )
}

export default EnterpriseWrapper
