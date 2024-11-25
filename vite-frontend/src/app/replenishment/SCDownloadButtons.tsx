'use client'

import { useEffect, useState } from 'react'

import Portal from '@ors/components/manage/Utils/Portal'

import { SCDownloadButtonProps } from './types'

import { IoDownloadOutline } from 'react-icons/io5'

export default function SCDownloadButtons(props: SCDownloadButtonProps) {
  const { downloadText, handleDownloadClick } = props

  const [domNode, setDomNode] = useState<HTMLElement | undefined>(undefined)

  useEffect(function () {
    const elTarget = document.getElementById('replenishment-sc-tab-buttons')
    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={!!domNode} domNode={domNode}>
      <div className="mb-2 flex items-center">
        <div
          className="flex cursor-pointer items-center gap-x-2 text-primary"
          onClick={handleDownloadClick}
        >
          {downloadText}
          <IoDownloadOutline className="text-secondary" size={18} />
        </div>
      </div>
    </Portal>
  )
}
