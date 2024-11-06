import { ApiBP } from '@ors/types/api_bp_get'

import React from 'react'

import { formatApiUrl } from '@ors/helpers'

import { IoDocumentTextOutline } from 'react-icons/io5'

export function FilesViewer(props: { business_plan: ApiBP }) {
  const { feedback_file_download_url, feedback_filename } = props.business_plan

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-2xl font-normal">File attachments</p>
      <div className="flex flex-col gap-3">
        {!feedback_filename ? (
          <p className="m-1 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <a
              className="m-0 flex items-center gap-2 no-underline"
              href={formatApiUrl(feedback_file_download_url)}
            >
              <IoDocumentTextOutline color="#0086C9" size="20" />
              <span className="text-lg text-gray-900">{feedback_filename}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
