import { useEffect, useMemo, useState } from 'react'

import { Alert, CircularProgress, Typography } from '@mui/material'
import { IoDownloadOutline } from 'react-icons/io5'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'
import useSearchParams from '@ors/hooks/useSearchParams'
import { decodeLongDownloadTarget, formatApiUrl } from '@ors/helpers'
import Button from '@mui/material/Button'

type DownloadState = 'preparing' | 'ready' | 'error'

function getFilename(response: Response) {
  const contentDisposition = response.headers.get('content-disposition') ?? ''
  const utf8Filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  const quotedFilename = contentDisposition.match(/filename="([^"]+)"/i)
  const plainFilename = contentDisposition.match(/filename=([^;]+)/i)

  if (utf8Filename?.[1]) {
    return decodeURIComponent(utf8Filename[1])
  }
  if (quotedFilename?.[1]) {
    return quotedFilename[1]
  }
  if (plainFilename?.[1]) {
    return plainFilename[1].trim()
  }

  return 'download'
}

export default function DownloadPage() {
  usePageTitle('Download')

  const searchParams = useSearchParams()
  const target = searchParams.get('target')
  const targetUrl = useMemo(
    () => (target ? formatApiUrl(decodeLongDownloadTarget(target)) : null),
    [target],
  )

  const [state, setState] = useState<DownloadState>('preparing')
  const [error, setError] = useState('')
  const [download, setDownload] = useState<{
    filename: string
    url: string
  } | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!targetUrl) {
      setState('error')
      setError('No download target was provided.')
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null

    async function prepareDownload() {
      setState('preparing')
      setError('')
      setDownload(null)

      try {
        const response = await fetch(targetUrl as string, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('The download could not be prepared.')
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        setDownload({ filename: getFilename(response), url: objectUrl })
        setState('ready')
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }
        setState('error')
        setError(
          err instanceof Error
            ? err.message
            : 'The download could not be prepared.',
        )
      }
    }

    prepareDownload()

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [targetUrl, retryCount])

  const saveFile = () => {
    if (!download) {
      return
    }

    const link = document.createElement('a')
    link.href = download.url
    link.download = download.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <PageWrapper className="flex min-h-[50vh] items-center justify-center">
      <div className="flex max-w-xl flex-col items-center gap-6 rounded-lg bg-white p-8 text-center shadow-sm">
        {state === 'preparing' && (
          <>
            <CircularProgress disableShrink />
            <Typography className="text-2xl" component="h1">
              Your download is being prepared...
            </Typography>
            <Typography color="text.secondary">
              This may take a few minutes. Please keep this page open.
            </Typography>
          </>
        )}

        {state === 'ready' && download && (
          <>
            <Typography className="text-2xl" component="h1">
              Your download is ready
            </Typography>
            <SubmitButton className="gap-2" type="button" onClick={saveFile}>
              Save file
              <IoDownloadOutline size={18} />
            </SubmitButton>
          </>
        )}

        {state === 'error' && (
          <>
            <Typography className="text-2xl" component="h1">
              Download failed
            </Typography>
            <Alert severity="error">{error}</Alert>
            <div className="flex flex-wrap justify-center gap-3">
              <SubmitButton
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Retry
              </SubmitButton>
              <Button
                variant={'text'}
                type="button"
                onClick={() => history.back()}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  )
}
