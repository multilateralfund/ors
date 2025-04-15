import { useState } from 'react'

import { filter } from 'lodash'

import { formatApiUrl } from '@ors/helpers'

import { HeaderWithIcon } from './HelperComponents'
import { BpDetails } from './types'

import { IoDownloadOutline, IoTrash } from 'react-icons/io5'
import { TbFiles } from 'react-icons/tb'

export function FilesViewer(props: BpDetails) {
  const { bpFiles, files, setFiles } = props

  const currentBpFiles = filter(
    bpFiles,
    (file) => !files?.deletedFilesIds?.includes(file.id),
  )
  const [currentFiles, setCurrentFiles] = useState(currentBpFiles || [])

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
      <HeaderWithIcon title="File attachments" Icon={TbFiles} />
      <div className="mt-3 flex flex-col gap-2.5">
        {currentFiles.length === 0 ? (
          <p className="m-1 ml-0 text-lg font-normal text-gray-500">
            No files available
          </p>
        ) : (
          currentFiles.map((file, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <a
                className="m-0 flex items-center gap-2.5 no-underline"
                href={formatApiUrl(file.download_url)}
              >
                <IoDownloadOutline className="mb-1 min-h-[20px] min-w-[20px] text-secondary" />
                <span className="text-lg font-medium text-secondary">
                  {file.filename}
                </span>
              </a>
              {setFiles && (
                <IoTrash
                  className="transition-colors mb-1 min-h-[20px] min-w-[20px] text-[#666] ease-in-out hover:cursor-pointer hover:text-inherit"
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
