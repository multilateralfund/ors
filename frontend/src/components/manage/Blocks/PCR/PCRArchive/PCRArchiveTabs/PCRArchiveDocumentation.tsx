import {
  SectionTitle,
  NoDataReported,
  detailItem,
} from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import {
  ArchiveIndividualPCRSupportingEvidence,
  ArchivePCRSupportingEvidence,
} from '../../interfaces'
import { borderedContainerClassname } from '../../constants'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const documentTypeLabels: Record<
  ArchiveIndividualPCRSupportingEvidence['document_type'],
  string
> = {
  report: 'Report',
  additional_document: 'Additional document',
}

const PCRArchiveDocumentation = ({
  pcr,
}: {
  pcr: {
    supporting_evidences: (ArchivePCRSupportingEvidence &
      Partial<Pick<ArchiveIndividualPCRSupportingEvidence, 'document_type'>>)[]
  }
}) => {
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
              const fileName = file.filename || 'PCR report'

              return (
                <div key={file.id}>
                  <div className="flex flex-wrap gap-x-7 gap-y-3">
                    <a
                      className="flex gap-2.5 text-secondary no-underline md:w-[45%]"
                      download={fileName}
                      href={formatApiUrl(file.download_url)}
                    >
                      <IoDownloadOutline className="min-h-5 min-w-5" />
                      <span className="text-lg font-medium">{fileName}</span>
                    </a>
                    {file.document_type && (
                      <div className="md:w-[45%]">
                        {detailItem(
                          'Document type',
                          documentTypeLabels[file.document_type] ??
                            file.document_type,
                        )}
                      </div>
                    )}
                  </div>
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
