import { Fragment, useContext } from 'react'

import { SectionTitle } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import { detailItem } from './ViewHelperComponents'
import { pcrFieldsMapping } from '../../constants'
import { getOtherOptionId } from '../../utils'
import { PCRResponse } from '../../interfaces'

import { Divider } from '@mui/material'
import { map } from 'lodash'

const PCROverview = ({ pcr }: { pcr: PCRResponse }) => {
  const { ratingOptions } = useContext(PCRDataContext)

  return (
    <>
      <PCROverviewPrefilledData {...{ pcr }} />
      <Divider className="my-6" />
      <div className="flex flex-col gap-y-4">
        {detailItem(
          pcrFieldsMapping.financial_figures_status,
          pcr.financial_figures_status,
        )}
        {detailItem(
          pcrFieldsMapping.financial_figures_status_explanation,
          pcr.financial_figures_status_explanation,
          'self-start whitespace-nowrap',
        )}
        {detailItem(
          pcrFieldsMapping.addresses,
          pcr.addresses,
          'self-start whitespace-nowrap',
        )}
        {detailItem(
          pcrFieldsMapping.project_goal_achieved,
          pcr.project_goal_achieved,
        )}
        {detailItem(
          pcrFieldsMapping.project_goal_achieved_explanation,
          pcr.project_goal_achieved_explanation,
          'self-start whitespace-nowrap',
        )}
        {detailItem(pcrFieldsMapping.rating, pcr.rating)}
        {pcr.rating === getOtherOptionId(ratingOptions) &&
          detailItem(
            pcrFieldsMapping.rating_explanation_other,
            pcr.rating_explanation_other,
            'self-start whitespace-nowrap',
          )}
        {detailItem(
          pcrFieldsMapping.rating_explanation,
          pcr.rating_explanation,
          'self-start whitespace-nowrap',
        )}
        <Divider />
        <div className="flex flex-col">
          <SectionTitle>Additional comments</SectionTitle>
          {pcr.additional_comments.length > 0
            ? map(pcr.additional_comments, (comment, commentIndex) => (
                <Fragment key={commentIndex}>
                  <div className="flex flex-col gap-y-4 pl-5">
                    {detailItem(pcrFieldsMapping.entity, comment.entity)}
                    {detailItem(
                      pcrFieldsMapping.comment,
                      comment.comment,
                      'self-start whitespace-nowrap',
                    )}
                  </div>
                  {commentIndex !== pcr.additional_comments.length - 1 && (
                    <Divider className="my-5" />
                  )}
                </Fragment>
              ))
            : '-'}
        </div>
        <Divider />
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by)}
      </div>
    </>
  )
}

export default PCROverview
