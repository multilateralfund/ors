import { UserType, userCanEditBusinessPlan } from '@ors/types/user_types'

import { usePathname } from 'next/navigation'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import CustomLink from '@ors/components/ui/Link/Link'
import { useStore } from '@ors/store'

const BPListHeader = ({ viewType }: { viewType: string }) => {
  const { user_type } = useStore((state) => state.user?.data)
  const { bpType } = useStore((state) => state.bpType)

  const pathname = usePathname()

  return (
    <div className="mb-8 flex items-center justify-between">
      <PageHeading>Business Plans</PageHeading>
      {userCanEditBusinessPlan[user_type as UserType] && (
        <div className="flex gap-4">
          <CustomLink
            className="px-4 py-2 text-lg uppercase"
            color="secondary"
            href="/business-plans/create"
            variant="contained"
            button
          >
            Create
          </CustomLink>
          {viewType === 'activities' && (
            <CustomLink
              className="px-4 py-2 text-lg uppercase"
              color="secondary"
              href={`${pathname}/${bpType}/edit`}
              variant="contained"
              button
            >
              Revise {bpType} BP
            </CustomLink>
          )}
        </div>
      )}
    </div>
  )
}

export default BPListHeader
