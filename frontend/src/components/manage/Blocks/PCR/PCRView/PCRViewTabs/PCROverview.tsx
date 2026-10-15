import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import {
  SubSectionTitle,
  detailItem,
  dateDetailItem,
} from './ViewHelperComponents'
import { getOtherOptionId, getValueClassName } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  pcrFieldsErrorsMapping,
  overviewTextareaClassname,
  borderedValueClassname,
} from '../../constants'

import { Divider } from '@mui/material'
import { map } from 'lodash'
import cx from 'classnames'

const PCROverview = ({ pcr }: { pcr: PCRResponse }) => {
  const { ratingOptions } = useContext(PCRDataContext)

  const rating =
    pcr.rating === getOtherOptionId(ratingOptions) &&
    pcr.rating_explanation_other
      ? `${pcr.rating}: ${pcr.rating_explanation_other}`
      : pcr.rating

  const spacingClassname = 'hidden lg:mt-0.5 lg:block lg:w-[20%] lg:self-start'
  const explanationClassname = {
    ...overviewTextareaClassname,
    containerClassname: '!gap-2 w-full lg:w-[85%] min-w-0 flex-1',
  }

  const getExplanationClassname = (className: any) => ({
    containerClassname: overviewTextareaClassname.containerClassname,
    labelClassname: 'lg:w-[20%]',
    valueClassname: cx(borderedValueClassname, 'rounded-full', className),
  })

  return (
    <>
      <PCROverviewPrefilledData {...{ pcr }} />
      <div className="mb-10 flex flex-col border border-solid border-[#e5e7eb]">
        <div className="bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>Indicators</SubSectionTitle>
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          {detailItem(
            pcrFieldsErrorsMapping.addresses,
            pcr.addresses,
            overviewTextareaClassname,
          )}
          <Divider className="my-6" />
          {detailItem(
            pcrFieldsMapping.project_goal_achieved,
            pcr.project_goal_achieved,
            getExplanationClassname(
              getValueClassName(pcr.project_goal_achieved),
            ),
          )}
          <div
            className={cx(
              'mt-3 flex',
              overviewTextareaClassname.containerClassname,
            )}
          >
            <div className={spacingClassname} />
            {detailItem(
              'Explanation',
              pcr.project_goal_achieved_explanation,
              explanationClassname,
            )}
          </div>
          <Divider className="my-6" />
          {detailItem(
            pcrFieldsMapping.rating,
            rating,
            getExplanationClassname(
              '!text-mlfs-hlYellow bg-primary border-primary',
            ),
          )}
          <div
            className={cx(
              'mt-3 flex',
              overviewTextareaClassname.containerClassname,
            )}
          >
            <div className={spacingClassname} />
            {detailItem(
              pcrFieldsErrorsMapping.rating_explanation,
              pcr.rating_explanation,
              explanationClassname,
            )}
          </div>
        </div>
      </div>
      <div className="mb-10 flex flex-col border border-solid border-[#e5e7eb]">
        <div className="bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>Additional comments</SubSectionTitle>
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pcr.additional_comments.length > 0 ? (
              map(pcr.additional_comments, (comment, commentIndex) => (
                <div
                  key={commentIndex}
                  className="flex flex-col rounded-lg bg-white p-6"
                >
                  {detailItem(pcrFieldsMapping.entity, comment.entity)}
                  <Divider className="my-6" />
                  {detailItem(pcrFieldsMapping.comment, comment.comment, {
                    containerClassname: 'w-[85%]',
                    valueClassname: '!text-black !font-normal !text-lg',
                  })}
                </div>
              ))
            ) : (
              <div className="text-3xl text-primary">-</div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-wrap gap-y-4 border border-solid border-[#e5e7eb] bg-white p-6 md:flex-row">
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by)}
        <Divider
          className="mx-8 hidden md:block"
          orientation="vertical"
          flexItem
        />
        {dateDetailItem(pcrFieldsMapping.completion_date, pcr.completion_date)}
      </div>
    </>
  )
}

export default PCROverview
