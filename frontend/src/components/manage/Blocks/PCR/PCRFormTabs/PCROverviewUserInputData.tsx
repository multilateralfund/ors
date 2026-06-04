import { PCRData, PCROverview, PCROverviewProps } from '../interfaces'
import {
  completionReportAuthorOpts,
  financialTypeOpts,
  initialRatingAdditionalComment,
  projectGoalsAchievedOpts,
  ratingEntityUserOpts,
  ratingOpts,
} from '../constants'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import { find, lowerCase, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { OptionsType } from '../../ProjectsListing/interfaces'

const PCROverviewUserInputData = ({
  PCRData,
  setPCRData,
  errors,
}: PCROverviewProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'overview'
  const overviewData = PCRData[sectionIdentifier]
  const { financial_figures_type, project_goals_achieved, rating } =
    overviewData

  const ratingAdditionalCommentsField = 'rating_additional_comment'
  const ratingAdditionalCommentsData =
    overviewData[ratingAdditionalCommentsField] || []

  const goalsNotAchievedId = find(
    projectGoalsAchievedOpts,
    (option) => lowerCase(option.name) === 'no',
  )?.id

  const getOtherOptId = (opts: OptionsType[]) =>
    find(opts, (option) => lowerCase(option.name).includes('other'))?.id

  const ratingAdditionalCommentsErrors =
    errors?.[ratingAdditionalCommentsField] ?? []

  console.log(PCRData.overview)

  const onAddSubstance = () => {
    setPCRData((prevData) => {
      const sectionData =
        prevData[sectionIdentifier][ratingAdditionalCommentsField] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [ratingAdditionalCommentsField]: [
            ...sectionData,
            initialRatingAdditionalComment,
          ],
        },
      }
    }, ratingAdditionalCommentsField)
  }

  const onRemoveOdsOdp = (index: number) => {
    setPCRData((prevData) => {
      const sectionData =
        prevData[sectionIdentifier][ratingAdditionalCommentsField] || []

      return {
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [ratingAdditionalCommentsField]: sectionData.filter(
            (_, idx) => idx !== index,
          ),
        },
      }
    }, ratingAdditionalCommentsField)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        {widgets['drop_down']<PCRData, PCROverview>(
          PCRData,
          setPCRData,
          sectionIdentifier,
          'financial_figures_type',
          financialTypeOpts,
          errors,
        )}
        {financial_figures_type &&
          widgets['text_area']<PCRData, PCROverview>(
            PCRData,
            setPCRData,
            sectionIdentifier,
            'financial_figures_type_explanation',
            errors,
          )}
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        {widgets['drop_down']<PCRData, PCROverview>(
          PCRData,
          setPCRData,
          sectionIdentifier,
          'project_goals_achieved',
          projectGoalsAchievedOpts,
          errors,
        )}
        {project_goals_achieved === goalsNotAchievedId &&
          widgets['text_area']<PCRData, PCROverview>(
            PCRData,
            setPCRData,
            sectionIdentifier,
            'project_goals_achieved_explanation',
            errors,
          )}
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        {widgets['drop_down']<PCRData, PCROverview>(
          PCRData,
          setPCRData,
          sectionIdentifier,
          'rating',
          ratingOpts,
          errors,
        )}
        {rating === getOtherOptId(ratingOpts) &&
          widgets['text_area']<PCRData, PCROverview>(
            PCRData,
            setPCRData,
            sectionIdentifier,
            'other_rating_comment',
            errors,
          )}
      </div>
      <div className="flex">
        {widgets['text_area']<PCRData, PCROverview>(
          PCRData,
          setPCRData,
          sectionIdentifier,
          'rating_explanation',
          errors,
        )}
      </div>
      <div className="flex">
        {widgets['drop_down']<PCRData, PCROverview>(
          PCRData,
          setPCRData,
          sectionIdentifier,
          'completion_report_done_by',
          completionReportAuthorOpts,
          errors,
        )}
      </div>

      <>
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-col flex-wrap gap-x-20">
            {map(ratingAdditionalCommentsData, (_, index) => (
              <span key={index}>
                <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                  {widgets['drop_down']<PCRData, PCROverview>(
                    PCRData,
                    setPCRData,
                    sectionIdentifier,
                    'user_type',
                    ratingEntityUserOpts,
                    ratingAdditionalCommentsErrors,
                    ratingAdditionalCommentsField,
                    index,
                  )}
                  {ratingAdditionalCommentsData[index].user_type ===
                    getOtherOptId(ratingEntityUserOpts) &&
                    widgets['text_area']<PCRData, PCROverview>(
                      PCRData,
                      setPCRData,
                      sectionIdentifier,
                      'other_user_type',
                      ratingAdditionalCommentsErrors,
                      ratingAdditionalCommentsField,
                      index,
                    )}
                  {widgets['text_area']<PCRData, PCROverview>(
                    PCRData,
                    setPCRData,
                    sectionIdentifier,
                    'comment',
                    ratingAdditionalCommentsErrors,
                    ratingAdditionalCommentsField,
                    index,
                  )}

                  <IoTrash
                    className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                    size={16}
                    onClick={() => {
                      onRemoveOdsOdp(index)
                    }}
                  />
                </div>
                {index !== ratingAdditionalCommentsData.length - 1 && (
                  <Divider className="my-5" />
                )}
              </span>
            ))}
          </div>
        </div>
        <SubmitButton
          title="Add substance"
          onSubmit={onAddSubstance}
          className="mr-auto h-8"
        />
      </>
    </div>
  )
}

export default PCROverviewUserInputData
