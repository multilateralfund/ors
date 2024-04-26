import { ApiFile } from '@ors/types/api_files'

import { IoDocumentTextOutline } from 'react-icons/io5'

export function FilesViewer(props: { files?: ApiFile[]; heading: string }) {
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
            <a key={index} className="m-0 flex items-center gap-2" href={file.download_url}>
              <IoDocumentTextOutline color="#0086C9" size="20" />
              <span className="text-lg text-gray-900">{file.filename}</span>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
