import {
  SectionTitle,
  SubSectionTitle,
  NrEntity,
  NoDataReported,
  detailItem,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { ArchiveIndividualPCRResponse } from '../interfaces'
import {
  pcrFieldsMapping,
  textareaClassname,
  borderedContainerClassname,
} from '../constants'
import { formatApiUrl } from '@ors/helpers'

import { Divider } from '@mui/material'
import { find, map } from 'lodash'
import cx from 'classnames'

const getFileKey = (fileName: string) =>
  fileName.split('.')[0].replace(/\s/g, '').toLowerCase()

const PCRArchiveIndividualLessonsLearned = ({
  pcr,
}: {
  pcr: ArchiveIndividualPCRResponse
}) => {
  const llData = pcr.learned_lessons

  const getReportFile = (reportFilename: string) =>
    find(
      pcr.supporting_evidences,
      (file) =>
        file.document_type === 'report' &&
        !!file.filename &&
        getFileKey(file.filename) === getFileKey(reportFilename),
    )

  return (
    <>
      <SectionTitle>Lessons learned</SectionTitle>
      <div className="mt-6 border-0 border-t border-solid border-primary pt-6">
        <div className={cx('bg-white p-6', borderedContainerClassname)}>
          <SubSectionTitle className="mb-5">Lessons learned</SubSectionTitle>
          {llData.length > 0 ? (
            map(llData, (ll, llIndex) => {
              const reportFile =
                ll.report_filename && getReportFile(ll.report_filename)

              return (
                <div key={ll.id}>
                  <div className="flex gap-3">
                    {NrEntity(llIndex)}
                    <div className="flex-1">
                      {ll.report_filename &&
                        (reportFile ? (
                          <a
                            className="mb-3 block w-fit text-secondary no-underline"
                            download={reportFile.filename}
                            href={formatApiUrl(reportFile.download_url)}
                          >
                            <span className="text-lg font-semibold">
                              {ll.report_filename}
                            </span>
                          </a>
                        ) : (
                          <h4 className="m-0 mb-3 text-lg font-semibold text-primary">
                            {ll.report_filename}
                          </h4>
                        ))}
                      {detailItem(
                        pcrFieldsMapping.description,
                        ll.description ?? '',
                        textareaClassname,
                      )}
                    </div>
                  </div>
                  {llIndex !== llData.length - 1 && (
                    <Divider className="-mx-6 my-4" />
                  )}
                </div>
              )
            })
          ) : (
            <NoDataReported text="No data reported." />
          )}
        </div>
      </div>
    </>
  )
}

export default PCRArchiveIndividualLessonsLearned
