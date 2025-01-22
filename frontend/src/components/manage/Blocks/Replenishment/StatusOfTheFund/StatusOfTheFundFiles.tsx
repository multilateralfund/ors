import type { ApiReplenishmentStatusFile } from '@ors/types/api_replenishment_status_files'

import { useMemo } from 'react'

import cx from 'classnames'

import { DownloadLink } from '@ors/components/ui/Button/Button'
import { formatApiUrl } from '@ors/helpers'
import { Divider, Typography } from '@mui/material'

function Label({ children }: any) {
  return <span className="font-bold uppercase text-[#4d4d4d]">{children}</span>
}

function FileCard(props: { files: ApiReplenishmentStatusFile[] }) {
  const { files } = props

  return (
    <li
      style={{ width: 'calc(32%)' }}
      className="rounded-lg bg-[#F5F5F5] px-2 py-4 text-xl"
    >
      <div className="flex items-center">
        <div className="grow">
          <Label>Meeting:</Label> {files[0].meeting_id}
        </div>
        <div>
          <Label>Year:</Label> {files[0].year ?? '-'}
        </div>
      </div>

      <div className="mt-2 flex justify-between">
        <Label>Files:</Label>
        <div
          className="flex max-h-[218px] w-[60%] flex-col overflow-y-auto"
          style={{ maxWidth: 'max-content' }}
        >
          {files.map((file, index) => (
            <>
              <DownloadLink
                href={formatApiUrl(file.download_url)}
                iconSize={18}
                iconClassname="min-w-[18px] mb-1"
              >
                <span
                  title={file.filename}
                  className="w-[95%] truncate text-[15px]"
                >
                  {file.filename}
                </span>
              </DownloadLink>
              {file.comment && (
                <p className="m-0 text-[15px]">{file.comment}</p>
              )}
              {index !== files.length - 1 && <Divider className="m-0.5" />}
            </>
          ))}
        </div>
      </div>
    </li>
  )
}

export default function StatusOfTheFundFiles({
  files,
  show,
}: {
  files: [string, ApiReplenishmentStatusFile[]][]
  show: boolean
}) {
  const fileListing = useMemo(
    function () {
      const result = []

      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          const filesData = files[i]
          result.push(<FileCard key={filesData[0]} files={filesData[1]} />)
        }
      }

      return result
    },
    [files],
  )

  const hasFiles = useMemo(() => files.length > 0, [files])

  return (
    <div
      className={cx(
        'mt-4 rounded-md border border-solid border-primary p-4',
        'origin-top opacity-0 transition-all',
        {
          'collapse h-0 scale-y-0': !show,
          'h-96 scale-y-100 opacity-100': show,
          'h-fit': show && !hasFiles,
        },
      )}
    >
      <h2 className="mt-0">Files</h2>
      {hasFiles ? (
        <div className="h-72 overflow-y-auto">
          <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-3 p-0">
            {fileListing}
          </ul>
        </div>
      ) : (
        <Typography className="text-lg">No files available</Typography>
      )}
    </div>
  )
}
