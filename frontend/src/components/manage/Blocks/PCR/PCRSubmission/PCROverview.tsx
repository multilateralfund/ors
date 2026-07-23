import { Fragment, useContext } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCROverviewPrefilledData from './PCROverviewPrefilledData'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { getOtherOptionId } from '../utils'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { map } from 'lodash'

const PCROverview = () => {
  const sectionIdentifier = 'overview'
  const additionalCommentsField = 'additional_comments'

  const {
    PCRData,
    setPCRData,
    financialFiguresTypeOptions,
    projectGoalsAchievedOptions,
    ratingOptions,
    userTypeOptions,
    completionReportDoneByOptions,
  } = useContext(PCRDataContext)

  const sectionData = PCRData[sectionIdentifier] || []
  const { rating } = sectionData
  const additionalCommentsData = sectionData[additionalCommentsField] || []

  const onAddAdditionalComment = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const subsectionData = sectionData[additionalCommentsField] || []
      const initialAdditionalComment = { user_type: null, user_comment: '' }

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
  }

  return (
    <>
      <PCROverviewPrefilledData />
      <Divider className="my-6" />
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_status"
            options={financialFiguresTypeOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_status_explanation"
            errors={{}}
          />
        </div>
        <div className="flex">
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="addresses"
            errors={{}}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="project_goal_achieved"
            options={projectGoalsAchievedOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="project_goal_achieved_explanation"
            errors={{}}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="rating"
            options={ratingOptions}
            errors={{}}
          />
          {rating === getOtherOptionId(ratingOptions) && (
            <PCRTextAreaWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="other_rating_explanation"
              errors={{}}
            />
          )}
        </div>
        <div className="flex">
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="rating_explanation"
            errors={{}}
          />
        </div>
        <div className="flex flex-col gap-y-4">
          {map(additionalCommentsData, (_, commentIndex) => (
            <Fragment key={commentIndex}>
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="user_type"
                  options={userTypeOptions}
                  errors={{}}
                  indexes={[commentIndex]}
                  subFields={[additionalCommentsField]}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="user_comment"
                  errors={{}}
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
        <PCRSelectWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="completed_by"
          options={completionReportDoneByOptions}
          errors={{}}
        />
      </div>
    </>
  )
}

export default PCROverview
