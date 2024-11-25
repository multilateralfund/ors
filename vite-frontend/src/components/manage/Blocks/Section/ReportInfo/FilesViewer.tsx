import { ApiFile } from '@ors/types/api_files'

import React from 'react'

import { useSnackbar } from 'notistack'

import { api, formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoDocumentTextOutline, IoTrash } from 'react-icons/io5'

export function FilesViewer(props: {
  files?: ApiFile[]
  heading: string
  isEdit: boolean
}) {
  const { enqueueSnackbar } = useSnackbar()
  const { cacheInvalidateReport, fetchFiles } = useStore(
    (state) => state.cp_reports,
  )

  if (!props.files) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-2xl font-normal">{props.heading}</p>
      <div className="flex flex-col gap-3">
        {props.files.length === 0 ? (
          <p className="m-1 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          props.files.map((file, index) => (
            <div key={index} className="flex items-center gap-2">
              <a
                className="m-0 flex w-min items-center gap-2"
                href={formatApiUrl(file.download_url)}
              >
                <IoDocumentTextOutline color="#0086C9" size="20" />
                <span className="text-lg text-gray-900">{file.filename}</span>
              </a>
              {props.isEdit && (
                <IoTrash
                  className="transition-colors ease-in-out hover:cursor-pointer hover:text-mlfs-purple"
                  size={20}
                  onClick={async () => {
                    try {
                      await api(
                        `api/country-programme/files/?country_id=${file.country_id}&year=${file.year}`,
                        {
                          data: {
                            file_ids: [file.id],
                          },
                          // TODO: Ask backend for proper DELETE endpoint
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          method: 'DELETE',
                        },
                      )
                      cacheInvalidateReport(file.country_id, file.year)
                      fetchFiles(file.country_id, file.year)
                    } catch (e) {
                      enqueueSnackbar(
                        <>
                          There was an error regarding the files. Please try
                          again.
                        </>,
                        {
                          variant: 'error',
                        },
                      )
                    }
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
