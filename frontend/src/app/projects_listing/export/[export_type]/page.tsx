import { useContext } from 'react'

import PExport from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PExport.tsx'
import {
  PageTitle,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import usePageTitle from '@ors/hooks/usePageTitle.ts'

import { Redirect, useParams } from 'wouter'

export default function Projects() {
  const { export_type } = useParams<Record<string, string>>()
  let pageTitle = 'Projects export'
  if (export_type === 'all') {
    pageTitle = 'Projects database'
  } else if (export_type === 'mya') {
    pageTitle = 'MYA warehouse'
  }
  usePageTitle(pageTitle)

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects || !['mya', 'all'].includes(export_type)) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle pageTitle="Generate DB" projectTitle={pageTitle} />
        </PageHeading>
      </HeaderTitle>
      <PExport export_type={export_type as 'mya' | 'all'} />
    </PageWrapper>
  )
}
