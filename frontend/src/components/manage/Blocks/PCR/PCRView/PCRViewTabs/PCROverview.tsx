import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import {
  SubSectionTitle,
  detailItem,
  SelectedEntity,
} from './ViewHelperComponents'
import { getValueClassName } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  pcrFieldsErrorsMapping,
  overviewTextareaClassname,
  borderedValueClassname,
  borderedContainerClassname,
} from '../../constants'

import { Divider } from '@mui/material'
import { map } from 'lodash'
import cx from 'classnames'

const PCROverview = () => {
  const { pcr: pcrData } = useContext(PCRDataContext)
  const pcr = pcrData.data as PCRResponse

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
      <PCROverviewPrefilledData />
      <div className={cx('mb-10 flex flex-col', borderedContainerClassname)}>
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
            pcr.rating,
            getExplanationClassname(
              '!text-mlfs-hlYellow bg-primary border-primary',
            ),
          )}
          {pcr.rating.includes('Other') && (
            <div
              className={cx(
                'mt-3 flex',
                overviewTextareaClassname.containerClassname,
              )}
            >
              <div className={spacingClassname} />
              {detailItem(
                pcrFieldsMapping.rating_explanation_other,
                pcr.rating_explanation_other,
                explanationClassname,
              )}
            </div>
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
      <div className={cx('mb-10 flex flex-col', borderedContainerClassname)}>
        <div className="bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>Additional comments</SubSectionTitle>
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <div className="flex flex-row flex-wrap items-center gap-2.5">
            <span className="text-[#4D4D4D]">
              Entities commenting ({pcr.additional_comments.length ?? 0}{' '}
              selected)
            </span>
            {map(pcr.additional_comments, (comment) =>
              SelectedEntity(comment.entity),
            )}
          </div>
          {pcr.additional_comments.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {map(pcr.additional_comments, (comment, commentIndex) => (
                <div
                  key={commentIndex}
                  className={cx(
                    'flex flex-col rounded-lg p-6',
                    borderedContainerClassname,
                  )}
                >
                  {detailItem(pcrFieldsMapping.entity, comment.entity)}
                  <Divider className="my-6" />
                  {detailItem(pcrFieldsMapping.comment, comment.comment, {
                    containerClassname: 'w-[85%]',
                    valueClassname: '!text-black !font-normal !text-lg',
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={cx('bg-white p-6', borderedContainerClassname)}>
        {detailItem(pcrFieldsMapping.completed_by, pcr.completed_by)}
      </div>
    </>
  )
}

export default PCROverview
