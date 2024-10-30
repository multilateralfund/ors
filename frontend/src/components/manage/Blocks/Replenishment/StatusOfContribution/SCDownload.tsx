'use client'

import { useState } from 'react'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import SCDownloadButtons from '@ors/app/replenishment/SCDownloadButtons'
import { formatApiUrl } from '@ors/helpers'

import SCDownloadDialog from './SCDownloadDialog'
import { SCViewProps } from './types'

const SCDownload = ({ period, year }: SCViewProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const periodYears = period?.split('-')

  const downloadCurrentViewUrl = year
    ? `/api/replenishment/status-of-contributions/${year}/export`
    : period
      ? `/api/replenishment/status-of-contributions/${periodYears?.[0]}/${periodYears?.[1]}/export`
      : '/api/replenishment/status-of-contributions/summary/export/'

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  return (
    <>
      <SCDownloadDialog
        open={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onCancel={handleCloseDialog}
      />
      <SCDownloadButtons
        downloadText={'Download'}
        handleDownloadClick={handleOpenDialog}
      />
      <DownloadButtons
        downloadTexts={['Download Current View']}
        downloadUrls={[formatApiUrl(downloadCurrentViewUrl)]}
      />
    </>
  )
}

export default SCDownload
