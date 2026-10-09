import { useContext, useState } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import {
  SectionTitle,
  SubSectionTitle,
  getCollapseIcon,
  detailItem,
} from './ViewHelperComponents'
import { getOtherOptionId } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  overviewTextareaClassname,
  borderedValueContainerClassname,
} from '../../constants'

import { Divider } from '@mui/material'
import { map } from 'lodash'

const PCROverview = ({ pcr }: { pcr: PCRResponse }) => {
  const { ratingOptions } = useContext(PCRDataContext)

  const [isAddressesSectionExpanded, setIsAddressesSectionExpanded] =
    useState(false)
  const [isGoalsSectionExpanded, setIsGoalsSectionExpanded] = useState(false)
  const [isRatingSectionExpanded, setIsRatingSectionExpanded] = useState(false)

  const collapseAddressesSection = () => {
    setIsAddressesSectionExpanded(!isAddressesSectionExpanded)
  }

  const collapseGoalsSection = () => {
    setIsGoalsSectionExpanded(!isGoalsSectionExpanded)
  }

  const collapseRatingSection = () => {
    setIsRatingSectionExpanded(!isRatingSectionExpanded)
  }
  return (
    <>
      <SectionTitle>PCR Overview</SectionTitle>
      <Divider className="mb-6 mt-4" />
      <PCROverviewPrefilledData {...{ pcr }} />
      <Divider className="my-6" />
      <SubSectionTitle>Indicators</SubSectionTitle>
      <div className="flex flex-col gap-y-4">
        <span className="flex w-full flex-col gap-2 lg:w-[65%]">
          <div className="flex flex-wrap items-center gap-x-4">
            <span className="text-[#4D4D4D]">{pcrFieldsMapping.addresses}</span>
            {getCollapseIcon(
              isAddressesSectionExpanded,
              collapseAddressesSection,
            )}
          </div>
          {isAddressesSectionExpanded && (
            <h4 className="m-0 text-lg font-normal text-black">
              {pcr.addresses || '-'}
            </h4>
          )}
        </span>
        <Divider className="w-full lg:w-[65%]" />
        <div className="flex gap-4">
          {detailItem(
            pcrFieldsMapping.project_goal_achieved,
            pcr.project_goal_achieved,
            borderedValueContainerClassname,
          )}
          {getCollapseIcon(isGoalsSectionExpanded, collapseGoalsSection)}
        </div>
        {isGoalsSectionExpanded &&
          detailItem(
            pcrFieldsMapping.project_goal_achieved_explanation,
            pcr.project_goal_achieved_explanation,
            overviewTextareaClassname,
          )}
        <Divider className="w-full lg:w-[65%]" />
        <div className="flex gap-4">
          {detailItem(
            pcrFieldsMapping.rating,
            pcr.rating,
            borderedValueContainerClassname,
          )}
          {getCollapseIcon(isRatingSectionExpanded, collapseRatingSection)}
        </div>
        {isRatingSectionExpanded && (
          <>
            {pcr.rating === getOtherOptionId(ratingOptions) &&
              detailItem(
                pcrFieldsMapping.rating_explanation_other,
                pcr.rating_explanation_other,
                overviewTextareaClassname,
              )}
            {detailItem(
              pcrFieldsMapping.rating_explanation,
              pcr.rating_explanation,
              overviewTextareaClassname,
            )}
          </>
        )}
        <Divider className="w-full lg:w-[65%]" />
        <div className="flex flex-col">
          <SubSectionTitle>Additional comments</SubSectionTitle>
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
        <Divider />
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by, {
          containerClassname: '!gap-2 sm:!flex-row sm:!gap-4',
          labelClassname: 'content-center',
        })}
      </div>
    </>
  )
}

export default PCROverview
