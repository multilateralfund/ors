'use client'

import { useEffect, useState } from 'react'

import { useLocation } from 'wouter'

import Portal from '@ors/components/manage/Utils/Portal'
import { DownloadLink, PrintButton } from '@ors/components/ui/Button/Button'

import { DownloadButtonsProps } from './types'

const PRINT_LANDSCAPE_PAGES = [
  '/replenishment/dashboard/statistics',
  '/replenishment/scale-of-assessment',
  '/replenishment/status-of-contributions',
]

export default function DownloadButtons(props: DownloadButtonsProps) {
  const { downloadTexts = [], downloadUrls = [], showPrintButton = true } = props
  const [pathname, _] = useLocation()

  useEffect(() => {
    let styleSheet = document.getElementById('dynamic-print-styles')
    if (!styleSheet) {
      styleSheet = document.createElement('style')
      styleSheet.id = 'dynamic-print-styles'
      document.head.appendChild(styleSheet)
    }

    if (PRINT_LANDSCAPE_PAGES.some((path) => pathname.startsWith(path))) {
      styleSheet.textContent = `
        @media print {
          @page {
            size: landscape;
          }
        }
      `
    } else {
      styleSheet.textContent = `
        @media print {
          @page {
            size: portrait;
          }
        }
      `
    }
  }, [pathname])

  const [domNode, setDomNode] = useState<HTMLElement | undefined>(undefined)

  useEffect(function () {
    const elTarget = document.getElementById('replenishment-tab-buttons')
    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={!!domNode} domNode={domNode}>
      <div className="mb-2 flex items-center gap-x-2">
        {downloadUrls?.map((url, i) => (
          <DownloadLink key={i} href={url ?? '#'}>
            {downloadTexts[i]}
          </DownloadLink>
        ))}
        {showPrintButton &&
          <PrintButton
            onClick={function () {
              window.print()
            }}
          >
            Print
          </PrintButton>
        }
      </div>
    </Portal>
  )
}
