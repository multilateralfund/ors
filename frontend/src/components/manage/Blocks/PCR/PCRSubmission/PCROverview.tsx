import { useContext } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextWidget, PCRTextAreaWidget } from './PCRWidgets'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import { EditSectionIndicator } from './EditHelperComponents'
import {
  SubSectionTitle,
  UserInfo,
  detailItem,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { getOtherOptionId } from '../utils'
import {
  pcrFieldsMapping,
  extendedBooleanFieldsOpts,
  borderedContainerClassname,
} from '../constants'

import { filter, findIndex, map } from 'lodash'
import { IoClose } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCROverview = () => {
  const sectionIdentifier = 'overview'
  const additionalCommentsField = 'additional_comments'

  const {
    PCRData,
    setPCRData,
    errors,
    setErrors,
    ratingOptions,
    entityOptions,
    completionReportDoneByOptions,
  } = useContext(PCRDataContext)

  const sectionData = PCRData[sectionIdentifier] || []
  const { rating } = sectionData
  const additionalCommentsData = sectionData[additionalCommentsField] || []

  const { overview: overviewErrors } = errors
  const additionalCommentsErrors = overviewErrors[additionalCommentsField]

  const suggestedWordLimit = (
    <span>Suggested 150-250 words · no character limit</span>
  )

  const onAddAdditionalComment = (entity: string) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const subsectionData = sectionData[additionalCommentsField] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...sectionData,
          [additionalCommentsField]: [
            ...subsectionData,
            { entity, comment: '' },
          ],
        },
      }
    }, additionalCommentsField)
  }

  const onRemoveAdditionalComments = (index: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const subsectionData = sectionData[additionalCommentsField] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...sectionData,
          [additionalCommentsField]: subsectionData.filter(
            (_, idx) => idx !== index,
          ),
        },
      }
    }, additionalCommentsField)

    setErrors((prevData: Record<string, any[]>) => ({
      ...prevData,
      [additionalCommentsField]: filter(
        prevData[additionalCommentsField],
        (_, commentIndex) => index !== commentIndex,
      ),
    }))
  }

  return (
    <>
      <PCROverviewPrefilledData />
      <div className={cx('mb-9 flex flex-col', borderedContainerClassname)}>
        <div className="flex justify-between gap-4 bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>Indicators</SubSectionTitle>
          <EditSectionIndicator />
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <div className="md:w-[65%]">
            <PCRTextAreaWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="addresses"
              rows={3}
              errors={overviewErrors}
            />
          </div>
          <Divider className="my-6" />
          <div className="flex flex-col flex-wrap justify-between gap-x-7 gap-y-4 lg:flex-row">
            <PCRSelectWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="project_goal_achieved"
              options={extendedBooleanFieldsOpts}
              errors={overviewErrors}
            />
            <div className="flex flex-col gap-3 lg:w-1/2">
              <PCRTextAreaWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="project_goal_achieved_explanation"
                placeholder="Which goals were not achieved and why"
                className="lg:!min-w-[unset]"
                errors={overviewErrors}
              />
              {suggestedWordLimit}
            </div>
          </div>
          <Divider className="my-6" />
          <div className="flex flex-col flex-wrap justify-between gap-x-7 gap-y-4 lg:flex-row">
            <div className="flex flex-col gap-4">
              <PCRSelectWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="rating"
                options={ratingOptions}
                errors={overviewErrors}
              />
              {rating === getOtherOptionId(ratingOptions) && (
                <PCRTextWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="rating_explanation_other"
                  className="md:!min-w-72"
                  errors={overviewErrors}
                />
              )}
            </div>
            <div className="flex flex-col gap-3 lg:w-1/2">
              <PCRTextAreaWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="rating_explanation"
                placeholder="Rationale for the rating selected"
                className="lg:!min-w-[unset]"
                errors={overviewErrors}
              />
              {suggestedWordLimit}
            </div>
          </div>
        </div>
      </div>
      <div className={cx('mb-9 flex flex-col', borderedContainerClassname)}>
        <div className="flex justify-between gap-4 bg-[#f4f5f6] px-6 py-4">
          <div className="flex items-center gap-4">
            <SubSectionTitle>Additional comments</SubSectionTitle>
            <UserInfo info="Select every entity commenting" placement="right" />
          </div>
          <EditSectionIndicator />
        </div>
        <div className="flex flex-col gap-y-4 border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <div className="flex gap-2">
            {map(entityOptions, (entity) => {
              const crtEntityIndex = findIndex(
                additionalCommentsData,
                (entry) => entry.entity === entity.name,
              )
              const isChecked = crtEntityIndex !== -1

              const selectEntity = () => {
                if (isChecked) {
                  onRemoveAdditionalComments(crtEntityIndex)
                } else {
                  onAddAdditionalComment(entity.name)
                }
              }

              return (
                <div
                  key={entity.name}
                  onClick={selectEntity}
                  className={cx(
                    'flex cursor-pointer items-center rounded-full border border-solid border-[#9CA3AF] p-1 pr-3',
                    isChecked
                      ? 'bg-primary text-white'
                      : 'bg-white text-primary',
                  )}
                >
                  <div
                    className={cx(
                      'm-2 h-4 w-4 shrink-0 border border-solid bg-white',
                      isChecked ? 'border-white' : 'border-[#9CA3AF]',
                    )}
                  />
                  <div className="text-lg leading-none">{entity.name}</div>
                </div>
              )
            })}
          </div>
          {map(additionalCommentsData, (comment, commentIndex) => (
            <div
              key={commentIndex}
              className={cx('rounded-lg p-6', borderedContainerClassname)}
            >
              <div className="flex items-center justify-between">
                {detailItem(pcrFieldsMapping.entity, comment.entity)}
                <IoClose
                  className="min-h-6 min-w-6 cursor-pointer fill-gray-600"
                  size={16}
                  onClick={() => {
                    onRemoveAdditionalComments(commentIndex)
                  }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-3">
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="comment"
                  errors={additionalCommentsErrors}
                  indexes={[commentIndex]}
                  subFields={[additionalCommentsField]}
                  excludeLabel
                />
                {suggestedWordLimit}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cx('bg-white p-6 pt-3', borderedContainerClassname)}>
        <PCRSelectWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="completed_by"
          options={completionReportDoneByOptions}
          errors={overviewErrors}
        />
      </div>
    </>
  )
}

export default PCROverview
