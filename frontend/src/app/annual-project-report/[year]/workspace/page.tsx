import { useParams } from 'wouter'
import usePageTitle from '@ors/hooks/usePageTitle.ts'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { useContext } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found'

export default function APRWorkspace() {
  const { year } = useParams()
  usePageTitle(`Annual Progress Report (${year})`)

  const { canViewAPR } = useContext(PermissionsContext)

  if (!canViewAPR) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">{`Annual Progress Report (${year}) workspace`}</PageHeading>
    </PageWrapper>
  )
}
