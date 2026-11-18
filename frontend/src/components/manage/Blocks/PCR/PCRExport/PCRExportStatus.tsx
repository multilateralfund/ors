import { useEffect, useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import { PCRExportType } from '../interfaces'
import { api, formatApiUrl } from '@ors/helpers'

import { Alert, CircularProgress, Typography } from '@mui/material'
import { IoDownloadOutline } from 'react-icons/io5'

const POLLING_INTERVAL = 3000

const PCRExportStatus = ({ exportId }: { exportId: string }) => {
  const [pcrExport, setPcrExport] = useState<PCRExportType | null>(null)
  const [requestFailed, setRequestFailed] = useState(false)

  const isPreparing =
    !requestFailed &&
    (!pcrExport ||
      pcrExport.status === 'pending' ||
      pcrExport.status === 'in_progress')
  const isFailed = requestFailed || pcrExport?.status === 'failed'

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const fetchStatus = async () => {
      try {
        const data = await api<PCRExportType>(`api/pcr-exports/${exportId}/`)

        if (cancelled || !data) {
          return
        }

        setPcrExport(data)

        if (data.status === 'pending' || data.status === 'in_progress') {
          timeout = setTimeout(fetchStatus, POLLING_INTERVAL)
        }
      } catch {
        if (!cancelled) {
          setRequestFailed(true)
        }
      }
    }

    fetchStatus()

    return () => {
      cancelled = true

      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [exportId])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex max-w-xl flex-col items-center gap-6 rounded-lg bg-white p-8 text-center shadow-sm">
        {isPreparing && (
          <>
            <CircularProgress disableShrink />
            <Typography className="text-2xl" component="h1">
              Your PCR export is being prepared...
            </Typography>
            <Typography className="text-secondary">
              {pcrExport
                ? `${pcrExport.pcr_count} PCR${pcrExport.pcr_count === 1 ? '' : 's'}. `
                : ''}
              This may take a few minutes. You can leave this page open, the
              download will be available here.
            </Typography>
          </>
        )}

        {pcrExport?.status === 'completed' && pcrExport.download_url && (
          <>
            <Typography className="text-2xl" component="h1">
              Your PCR export is ready
            </Typography>
            <CustomLink
              className="flex h-10 items-center gap-2 px-4 py-2 text-lg uppercase"
              href={formatApiUrl(pcrExport.download_url)}
              color="secondary"
              variant="contained"
              download
              button
            >
              Download
              <IoDownloadOutline size={18} />
            </CustomLink>
            <Typography className="text-secondary">
              The file is available for 24 hours.
            </Typography>
          </>
        )}

        {isFailed && (
          <>
            <Typography className="text-2xl" component="h1">
              Export failed
            </Typography>
            <Alert severity="error">
              {pcrExport?.error ||
                'The export could not be found. Please start a new export.'}
            </Alert>
          </>
        )}

        {!isPreparing && (
          <CustomLink className="text-lg" href="/pcr">
            Back to the PCRs
          </CustomLink>
        )}
      </div>
    </div>
  )
}

export default PCRExportStatus
