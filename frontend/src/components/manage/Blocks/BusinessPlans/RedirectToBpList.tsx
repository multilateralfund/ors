'use client'

import NextLink from 'next/link'

import { IoReturnUpBack } from 'react-icons/io5'

export const RedirectToBpList = ({
  currentYearRange,
}: {
  currentYearRange: string
}) => {
  const bpListUrl = `/business-plans/list/activities/${currentYearRange}`

  return (
    <div className="w-fit">
      <NextLink className=" text-black no-underline" href={bpListUrl}>
        <div className="mb-2 flex items-center gap-2 text-lg uppercase">
          <IoReturnUpBack size={18} />
          Business Plans
        </div>
      </NextLink>
    </div>
  )
}
