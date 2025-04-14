'use client'

import { useEffect, useState } from 'react'

import Portal from '@ors/components/manage/Utils/Portal'
import { DownloadLink } from '@ors/components/ui/Button/Button'
import CustomLink from '@ors/components/ui/Link/Link'
import { useLocation } from 'wouter'
import { useStore } from '@ors/store'
import { lowerCase } from 'lodash'
import { userCanEditBusinessPlan, UserType } from '@ors/types/user_types'

const BPTableToolbarButtons = (props: any) => {
  const { downloadTexts, downloadUrls } = props

  const [pathname] = useLocation()
  const splitPathName = pathname.split('/')
  const currentPage = splitPathName.splice(splitPathName.length - 2, 1)
  const formattedPathname = splitPathName.join('/')

  const { bpType } = useStore((state) => state.bpType)
  const { user_type } = useStore((state) => state.user?.data)
  const { setActiveTab } = useStore((state) => state.bp_current_tab)

  const [domNode, setDomNode] = useState<Element>()

  const setCurrentTab = () => {
    setActiveTab(currentPage[0] === 'report-info' ? 0 : 1)
  }

  useEffect(function () {
    const elTarget =
      document.getElementById('bp-activities-export-button') ||
      document.getElementById('bp-table-export-button')

    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    bpType && (
      <Portal active={!!domNode} domNode={domNode}>
        <div className="flex items-center gap-x-3">
          {userCanEditBusinessPlan[user_type as UserType] && (
            <CustomLink
              className="text-nowrap px-4 py-2 text-lg uppercase"
              color="secondary"
              href={`${formattedPathname}/${lowerCase(bpType)}/edit`}
              variant="contained"
              button
              onClick={setCurrentTab}
            >
              Revise BP
            </CustomLink>
          )}
          {downloadUrls?.map((url: string, i: number) => (
            <DownloadLink key={i} href={url ?? '#'} iconClassname="mb-1">
              {downloadTexts[i]}
            </DownloadLink>
          ))}
        </div>
      </Portal>
    )
  )
}

export default BPTableToolbarButtons
