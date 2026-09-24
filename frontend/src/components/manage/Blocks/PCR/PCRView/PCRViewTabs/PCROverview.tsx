import { Fragment, useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import { SectionTitle, detailItem } from './ViewHelperComponents'
import { getOtherOptionId } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  borderedValueClassname,
  textareaClassname,
} from '../../constants'

import { Divider } from '@mui/material'
import { map } from 'lodash'

const PCROverview = ({ pcr }: { pcr: PCRResponse }) => {
  const { ratingOptions } = useContext(PCRDataContext)

  return (
    <>
      <div className="text-[28px] font-medium text-[#002A3C]">PCR Overview</div>
      <Divider className="mb-6 mt-4" />
      <PCROverviewPrefilledData {...{ pcr }} />
      <Divider className="my-6" />
      <SectionTitle>Indicators</SectionTitle>
      <div className="flex flex-col gap-y-4">
        {detailItem(
          pcrFieldsMapping.financial_figures_status,
          pcr.financial_figures_status,
          { valueClassname: borderedValueClassname },
        )}
        {detailItem(
          pcrFieldsMapping.financial_figures_status_explanation,
          pcr.financial_figures_status_explanation,
          textareaClassname,
        )}
        <Divider />
        {detailItem(pcrFieldsMapping.addresses, pcr.addresses, {
          containerClassname: '!gap-2 w-[65%]',
          valueClassname: '!text-black !font-normal !text-lg',
        })}
        <Divider />
        {detailItem(
          pcrFieldsMapping.project_goal_achieved,
          pcr.project_goal_achieved,
          { valueClassname: borderedValueClassname },
        )}
        {detailItem(
          pcrFieldsMapping.project_goal_achieved_explanation,
          pcr.project_goal_achieved_explanation,
          textareaClassname,
        )}
        <Divider />
        {detailItem(pcrFieldsMapping.rating, pcr.rating, {
          valueClassname: borderedValueClassname,
        })}
        {pcr.rating === getOtherOptionId(ratingOptions) &&
          detailItem(
            pcrFieldsMapping.rating_explanation_other,
            pcr.rating_explanation_other,
            textareaClassname,
          )}
        {detailItem(
          pcrFieldsMapping.rating_explanation,
          pcr.rating_explanation,
          textareaClassname,
        )}
        <Divider />
        <div className="flex flex-col">
          <SectionTitle>Additional comments</SectionTitle>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pcr.additional_comments.length > 0
              ? map(pcr.additional_comments, (comment, commentIndex) => (
                  <Fragment key={commentIndex}>
                    <div className="flex flex-col rounded-lg bg-white p-6">
                      {detailItem(pcrFieldsMapping.entity, comment.entity)}
                      <Divider className="my-6" />
                      {detailItem(pcrFieldsMapping.comment, comment.comment, {
                        containerClassname: 'w-[85%]',
                        valueClassname: '!text-black !font-normal !text-lg',
                      })}
                    </div>
                  </Fragment>
                ))
              : '-'}
          </div>
        </div>
        <Divider />
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by, {
          containerClassname: '!flex-row !gap-4',
          labelClassname: 'content-center',
        })}
      </div>
    </>
  )
}

export default PCROverview
