import { Fragment, useContext } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'

import { find, lowerCase, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'

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
  const { project_goals_achieved, rating } = sectionData
  const additionalCommentsData = sectionData[additionalCommentsField] || []

  const goalsNotAchievedId = find(
    projectGoalsAchievedOptions,
    (option) => lowerCase(option.name) === 'no',
  )?.id

  const otherOptionId = find(ratingOptions, (option) =>
    lowerCase(option.name).includes('other'),
  )?.id

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
      PCR prefilled
      <Divider className="my-6" />
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_type"
            options={financialFiguresTypeOptions}
            errors={{}}
          />
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="financial_figures_type_explanation"
            errors={{}}
          />
        </div>
        <div className="flex">
          <PCRTextAreaWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="enterprises_addresses"
            errors={{}}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="project_goals_achieved"
            options={projectGoalsAchievedOptions}
            errors={{}}
          />
          {project_goals_achieved === goalsNotAchievedId && (
            <PCRTextAreaWidget
              {...{ PCRData, setPCRData, sectionIdentifier }}
              field="project_goals_achieved_explanation"
              errors={{}}
            />
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <PCRSelectWidget
            {...{ PCRData, setPCRData, sectionIdentifier }}
            field="rating"
            options={ratingOptions}
            errors={{}}
          />
          {rating === otherOptionId && (
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
          field="completion_report_done_by"
          options={completionReportDoneByOptions}
          errors={{}}
        />
      </div>
    </>
  )
}

export default PCROverview
