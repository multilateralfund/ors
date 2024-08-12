'use client'

import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

import Portal from '@ors/components/manage/Utils/Portal'
import { DownloadLink, PrintButton } from '@ors/components/ui/Button/Button'

const PRINT_LANDSCAPE_PAGES = [
  '/replenishment/scale-of-assessment',
  '/replenishment/status-of-contributions',
]

export default function DownloadButtons(props) {
  const { downloadTexts, downloadUrls } = props
  const pathname = usePathname()

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

  const [domNode, setDomNode] = useState(null)

  useEffect(function () {
    const elTarget = document.getElementById('replenishment-tab-buttons')
    if (elTarget) {
      setDomNode(elTarget)
    }
  }, [])

  return (
    <Portal active={domNode} domNode={domNode}>
      <div className="mb-2 flex items-center gap-x-2">
        {downloadUrls?.map((url, i) => (
          <DownloadLink key={i} href={url ?? '#'}>
            {downloadTexts[i]}
          </DownloadLink>
        ))}
        <PrintButton
          onClick={function () {
            window.print()
          }}
        >
          Print
        </PrintButton>
      </div>
    </Portal>
  )
}
