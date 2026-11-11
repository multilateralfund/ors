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

import { Divider } from '@mui/material'
import { map } from 'lodash'
import cx from 'classnames'

const PCRArchiveIndividualLessonsLearned = ({
  pcr,
}: {
  pcr: ArchiveIndividualPCRResponse
}) => {
  const llData = pcr.learned_lessons

  return (
    <>
      <SectionTitle>Lessons learned</SectionTitle>
      <div className="mt-6 border-0 border-t border-solid border-primary pt-6">
        <div className={cx('bg-white p-6', borderedContainerClassname)}>
          <SubSectionTitle className="mb-5">Lessons learned</SubSectionTitle>
          {llData.length > 0 ? (
            map(llData, (ll, llIndex) => (
              <div key={ll.id}>
                <div className="flex gap-3">
                  {NrEntity(llIndex)}
                  <div className="flex-1">
                    <h4 className="m-0 mb-3 text-lg font-semibold text-primary">
                      {ll.report_filename || '-'}
                    </h4>
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
            ))
          ) : (
            <NoDataReported text="No data reported." />
          )}
        </div>
      </div>
    </>
  )
}

export default PCRArchiveIndividualLessonsLearned
