import {
  SectionTitle,
  NoDataReported,
} from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import { borderedContainerClassname } from '../../constants'
import { ArchivePCRResponse } from '../../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCRArchiveDocumentation = ({ pcr }: { pcr: ArchivePCRResponse }) => {
  const evidencesData = pcr.supporting_evidences

  return (
    <>
      <SectionTitle>Other supporting evidence</SectionTitle>
      <div className="mt-6 border-0 border-t border-solid border-primary pt-6">
        <div
          className={cx(
            'flex flex-col bg-white p-6',
            borderedContainerClassname,
          )}
        >
          {evidencesData.length === 0 ? (
            <NoDataReported text="No files available." />
          ) : (
            evidencesData.map((file, index) => {
              const fileName = file.filename || file.file.split('/').pop()

              return (
                <div key={file.id}>
                  <a
                    className="flex gap-2.5 text-secondary no-underline md:w-[45%]"
                    download={fileName}
                    href={formatApiUrl(file.file)}
                  >
                    <IoDownloadOutline className="min-h-5 min-w-5" />
                    <span className="text-lg font-medium">{fileName}</span>
                  </a>
                  {index !== evidencesData.length - 1 && (
                    <Divider className="my-4" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default PCRArchiveDocumentation
