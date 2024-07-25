import { formatApiUrl } from '@ors/helpers'

import { IoDocumentTextOutline } from 'react-icons/io5'

export default function ViewFiles(props) {
  const { files } = props

  if (!files) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {files.length === 0 ? (
        <p className="m-1 font-normal text-gray-500">No files</p>
      ) : (
        files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 bg-transparent">
            <IoDocumentTextOutline color="#0086C9" size="16" />
            <a
              className="text-secondary no-underline"
              href={formatApiUrl(file.download_url)}
            >
              {file.filename}
            </a>
          </div>
        ))
      )}
    </div>
  )
}
