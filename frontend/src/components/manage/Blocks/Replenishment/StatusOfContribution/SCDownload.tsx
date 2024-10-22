'use client'

import { useState } from 'react'

import { keys, pickBy } from 'lodash'

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

  const handleSubmitDialog = (formData: FormData) => {
    const data = Object.fromEntries(formData.entries())

    const yearsSelected = keys(pickBy(data, (_, key) => !key.includes('-')))
    const trienniumsSelected = keys(pickBy(data, (_, key) => key.includes('-')))

    if (yearsSelected.length > 0 || trienniumsSelected.length > 0) {
      console.log('download')
    } else {
      console.log('no download')
    }
  }

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  return (
    <>
      <SCDownloadDialog
        handleSubmitEditDialog={handleSubmitDialog}
        open={isDialogOpen}
        onCancel={handleCloseDialog}
      />
      <SCDownloadButtons
        downloadText={'Download'}
        handleDownloadClick={handleOpenDialog}
        // downloadUrl={formatApiUrl(
        //   '/api/replenishment/status-of-contributions/statistics-export/',
        // )}
      />
      <DownloadButtons
        downloadTexts={['Download Current View']}
        downloadUrls={[formatApiUrl(downloadCurrentViewUrl)]}
      />
    </>
  )
}

export default SCDownload
