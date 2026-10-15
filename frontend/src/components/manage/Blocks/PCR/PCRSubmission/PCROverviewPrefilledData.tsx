import { useContext, useState } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewProjectOverview from '../PCRView/PCRViewTabs/PCROverviewProjectOverview'
import PCROverviewFundingData from '../PCRView/PCRViewTabs/PCROverviewFundingData'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import {
  EditSectionIndicator,
  SubSectionTitle,
  getCollapseIcon,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { financialFiguresTypeOptions } from '../constants'

const PCROverviewPrefilledData = () => {
  const sectionIdentifier = 'overview'

  const { PCRData, setPCRData, errors, fundsByAgency } =
    useContext(PCRDataContext)
  const { overview: overviewErrors } = errors

  const [isFundingExpanded, setIsFundingExpanded] = useState(false)

  const collapseFunding = () => {
    setIsFundingExpanded(!isFundingExpanded)
  }

  return (
    <>
      <PCROverviewProjectOverview
        numberEnterprises={fundsByAgency.total_number_of_enterprises.toString()}
      />
      <div className="mb-9 flex flex-col border border-solid border-[#e5e7eb]">
        <div className="flex flex-wrap justify-between gap-4 bg-[#f4f5f6] px-6 py-4">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={collapseFunding}
          >
            {getCollapseIcon(isFundingExpanded)}
            <SubSectionTitle>Funding (US$)</SubSectionTitle>
          </div>
          <div className="flex flex-wrap gap-6">
            <PCRSelectWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="financial_figures_status"
              options={financialFiguresTypeOptions}
              errors={overviewErrors}
              className="flex flex-row items-center gap-3"
            />
            <EditSectionIndicator />
          </div>
        </div>
        <div className="border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <PCROverviewFundingData {...{ isFundingExpanded }} />
          <div className="mt-6 flex flex-col gap-3">
            <PCRTextAreaWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="financial_figures_status_explanation"
              placeholder="e.g. why the figures are provisional and when final figures are expected"
              errors={overviewErrors}
            />
            <span>Suggested 150-250 words · no character limit</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default PCROverviewPrefilledData
