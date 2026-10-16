import { useState } from 'react'

import PCROverviewProjectOverview from './PCROverviewProjectOverview'
import PCROverviewFundingData from './PCROverviewFundingData'
import {
  SubSectionTitle,
  getCollapseIcon,
  detailItem,
} from './ViewHelperComponents'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  pcrFieldsErrorsMapping,
  overviewTextareaClassname,
  borderedValueContainerClassname,
  borderedContainerClassname,
} from '../../constants'

import cx from 'classnames'

const PCROverviewPrefilledData = ({ pcr }: { pcr: PCRResponse }) => {
  const [isFundingExpanded, setIsFundingExpanded] = useState(false)

  const collapseFunding = () => {
    setIsFundingExpanded(!isFundingExpanded)
  }

  return (
    <>
      <PCROverviewProjectOverview
        numberEnterprises={pcr.total_number_of_enterprises}
      />
      <div className={cx('mb-9 flex flex-col', borderedContainerClassname)}>
        <div className="flex flex-wrap justify-between gap-4 bg-[#f4f5f6] px-6 py-4">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={collapseFunding}
          >
            {getCollapseIcon(isFundingExpanded)}
            <SubSectionTitle>Funding (US$)</SubSectionTitle>
          </div>
          {detailItem(
            pcrFieldsMapping.financial_figures_status,
            pcr.financial_figures_status,
            {
              ...borderedValueContainerClassname,
              valueClassname: cx(
                borderedValueContainerClassname.valueClassname,
                'rounded-full !bg-[#faebd5] !text-[#7d5817] !border-[#eed3ad]',
              ),
            },
          )}
        </div>
        <div className="border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <PCROverviewFundingData {...{ isFundingExpanded }} />
          <div className="mt-8">
            {detailItem(
              pcrFieldsErrorsMapping.financial_figures_status_explanation,
              pcr.financial_figures_status_explanation,
              overviewTextareaClassname,
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PCROverviewPrefilledData
