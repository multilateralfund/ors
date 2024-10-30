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

  const baseUrl = '/api/replenishment/status-of-contributions/export/'

  const downloadCurrentViewUrl = year
    ? `${baseUrl}?years=${year}`
    : period
      ? `${baseUrl}?triennials=${periodYears?.[0]}`
      : baseUrl

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  return (
    <>
      <SCDownloadDialog
        baseUrl={baseUrl}
        open={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onCancel={handleCloseDialog}
      />
      <SCDownloadButtons
        downloadText={'Download ALL'}
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
