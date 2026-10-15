import { Fragment, useContext } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import {
  PCRSelectWidget,
  PCRTextWidget,
  PCRTextAreaWidget,
  PCRDateWidget,
} from './PCRWidgets'
import {
  EditSectionIndicator,
  SubSectionTitle,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { booleanFieldsOpts } from '../constants'
import { getOtherOptionId } from '../utils'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { filter, map } from 'lodash'

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

  const onAddAdditionalComment = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const subsectionData = sectionData[additionalCommentsField] || []
      const initialAdditionalComment = { entity: '', comment: '' }

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...sectionData,
          [additionalCommentsField]: [
            ...subsectionData,
            initialAdditionalComment,
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
      <div className="mb-9 flex flex-col border border-solid border-[#e5e7eb]">
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
              options={booleanFieldsOpts}
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
              <span>Suggested 150-250 words · no character limit</span>
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
              <span>Suggested 150-250 words · no character limit</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-9 flex flex-col border border-solid border-[#e5e7eb]">
        <div className="flex justify-between gap-4 bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>Additional comments</SubSectionTitle>
          <EditSectionIndicator />
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          <div className="flex flex-col gap-y-4">
            {map(additionalCommentsData, (_, commentIndex) => (
              <Fragment key={commentIndex}>
                <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                  <PCRSelectWidget
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="entity"
                    options={entityOptions}
                    errors={additionalCommentsErrors}
                    indexes={[commentIndex]}
                    subFields={[additionalCommentsField]}
                  />
                  <PCRTextAreaWidget
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="comment"
                    errors={additionalCommentsErrors}
                    indexes={[commentIndex]}
                    subFields={[additionalCommentsField]}
                  />
                  <IoTrash
                    className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                    size={16}
                    onClick={() => {
                      onRemoveAdditionalComments(commentIndex)
                    }}
                  />
                </div>
                {commentIndex !== additionalCommentsData.length - 1 && (
                  <Divider className="my-5" />
                )}
              </Fragment>
            ))}
          </div>
          <SubmitButton
            title="Add additional comment"
            onSubmit={onAddAdditionalComment}
            className="mr-auto h-8"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-4 border border-solid border-[#e5e7eb] bg-white p-6 pt-3">
        <PCRSelectWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="completed_by"
          options={completionReportDoneByOptions}
          errors={overviewErrors}
        />
        <PCRDateWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="completion_date"
          errors={overviewErrors}
        />
      </div>
    </>
  )
}

export default PCROverview
