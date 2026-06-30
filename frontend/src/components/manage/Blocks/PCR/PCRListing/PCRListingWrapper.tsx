import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PCRTable from './PCRTable'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'

const PCRListingWrapper = () => {
  const initialFilters = { offset: 0, limit: 50 }
  const pcrProjects = useGetPCRProjects(initialFilters)
  const { loading } = pcrProjects

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Project Completion Reports</PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <PCRTable {...{ pcrProjects }} />
    </>
  )
}

export default PCRListingWrapper
