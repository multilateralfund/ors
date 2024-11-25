'use client'

import { useEffect, useState } from 'react'

import Portal from '@ors/components/manage/Utils/Portal'
import { DownloadLink } from '@ors/components/ui/Button/Button'

const DownloadButtons = (props: any) => {
  const { downloadTexts, downloadUrls } = props

  const [domNode, setDomNode] = useState<Element>()

  useEffect(function () {
    const elTarget =
      document.getElementById('bp-activities-export-button') ||
      document.getElementById('bp-table-export-button') ||
      document.getElementById('bp-consolidated-table-export-button')

    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={!!domNode} domNode={domNode}>
      <div className="flex items-center gap-x-2">
        {downloadUrls?.map((url: string, i: number) => (
          <DownloadLink key={i} href={url ?? '#'}>
            {downloadTexts[i]}
          </DownloadLink>
        ))}
      </div>
    </Portal>
  )
}

export default DownloadButtons
