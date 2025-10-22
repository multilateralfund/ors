import { useContext } from 'react'

import ProjectsSettings from '@ors/components/manage/Blocks/ProjectsListing/ProjectsSettings/ProjectsSettings'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { useGetProjectSettings } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjectSettings'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function ProjectsSettingsWrapper() {
  usePageTitle('Project settings')

  const { canSetProjectSettings } = useContext(PermissionsContext)

  if (!canSetProjectSettings) {
    return <Redirect to="/projects-listing/listing" />
  }

  const { data, setParams } = useGetProjectSettings()

  return (
    <PageWrapper>
      <RedirectBackButton />
      <PageHeading className="min-w-fit">IA/BA Portal - Settings</PageHeading>
      {data && <ProjectsSettings {...{ data, setParams }} />}
    </PageWrapper>
  )
}
