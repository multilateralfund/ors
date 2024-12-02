import type { ApiReplenishmentStatusFile } from '@ors/types/api_replenishment_status_files'

import { useMemo } from 'react'

import cx from 'classnames'

import { DownloadLink } from '@ors/components/ui/Button/Button'
import { formatApiUrl } from '@ors/helpers'

function Label({ children }: any) {
  return <span className="font-bold uppercase text-[#4d4d4d]">{children}</span>
}

function FileCard(props: { file: ApiReplenishmentStatusFile }) {
  const { file } = props
  const downloadUrl = formatApiUrl(file.download_url)
  return (
    <li
      style={{ width: 'calc(32%)' }}
      className="rounded-lg bg-[#F5F5F5] px-2 py-4 text-xl"
    >
      <div className="flex items-center">
        <div className="grow">
          <Label>Meeting:</Label> {file.meeting_id}
        </div>
        <div>
          <Label>Year:</Label> {file.year}
        </div>
      </div>
      <div className="my-2 flex items-center justify-between">
        <Label>File:</Label>{' '}
        <DownloadLink href={downloadUrl}>{file.filename}</DownloadLink>
      </div>
      <p className="m-0 mt-2">{file.comment}</p>
    </li>
  )
}

export default function StatusOfTheFundFiles({
  show,
  files,
}: {
  files: ApiReplenishmentStatusFile[]
  show: boolean
}) {
  const fileListing = useMemo(
    function () {
      const result = []

      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          result.push(<FileCard key={file.id} file={file} />)
        }
      }

      return result
    },
    [files],
  )

  return (
    <div
      className={cx(
        'mt-4 rounded-md border border-solid border-primary p-4',
        'origin-top opacity-0 transition-all',
        {
          'collapse h-0 scale-y-0': !show,
          'h-96 scale-y-100 opacity-100': show,
        },
      )}
    >
      <h2 className="mt-0">Files</h2>
      <div className="h-72 overflow-y-auto">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {fileListing}
        </ul>
      </div>
    </div>
  )
}
