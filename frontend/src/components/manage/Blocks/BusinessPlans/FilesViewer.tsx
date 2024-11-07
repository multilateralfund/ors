import React, { useState } from 'react'

import { filter } from 'lodash'

import { formatApiUrl } from '@ors/helpers'

import { BpDetails } from './types'

import { IoDocumentTextOutline, IoTrash } from 'react-icons/io5'

export function FilesViewer(props: BpDetails) {
  const { bpFiles, files, setFiles } = props

  const [currentFiles, setCurrentFiles] = useState(bpFiles)

  if (!bpFiles) {
    return null
  }

  const handleDelete = (fileId: number) => {
    const updatedFiles = filter(currentFiles, (file) => file.id !== fileId)
    setCurrentFiles(updatedFiles)

    if (setFiles) {
      setFiles({
        ...files,
        deletedFilesIds: [...(files?.deletedFilesIds || []), fileId],
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-2xl font-normal">File attachments</p>
      <div className="flex flex-col gap-3">
        {currentFiles.length === 0 ? (
          <p className="m-1 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          currentFiles.map((file, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <a
                className="m-0 flex items-center gap-2 no-underline"
                href={formatApiUrl(file.download_url)}
              >
                <IoDocumentTextOutline color="#0086C9" size="20" />
                <span className="text-lg text-gray-900">{file.filename}</span>
              </a>
              {setFiles && (
                <IoTrash
                  className="transition-colors ease-in-out hover:cursor-pointer hover:text-mlfs-purple"
                  size={20}
                  onClick={() => handleDelete(file.id)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
