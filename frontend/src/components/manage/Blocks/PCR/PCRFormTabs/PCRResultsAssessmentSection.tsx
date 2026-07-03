import { PCRData, PCRSectionsProps, PCRResultsAssessment } from '../interfaces'
import { initialResultsAssessmentFieldsEntry } from '../constants'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import { keys, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import React from 'react'

const PCRResultsAssessmentSection = ({
  PCRData,
  setPCRData,
  errors,
  setCurrentTab,
}: PCRSectionsProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'results_assessment'

  const resultsAssessmentData = PCRData[sectionIdentifier] || []
  const resultsAssessmentErrors = errors?.[sectionIdentifier] ?? []

  const onAddActivity = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: [
          ...sectionData,
          initialResultsAssessmentFieldsEntry,
        ],
      }
    }, sectionIdentifier)
  }

  const onRemoveActivity = (index: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.filter((_, idx) => idx !== index),
      }
    }, sectionIdentifier)
  }

  console.log(resultsAssessmentData)

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-col flex-wrap gap-x-20">
              {map(resultsAssessmentData, (_, index) => (
                <span key={index}>
                  <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                    {map(
                      keys(initialResultsAssessmentFieldsEntry),
                      (field, fieldIndex) => (
                        <React.Fragment key={fieldIndex}>
                          {widgets['text_area']<PCRData, PCRResultsAssessment>(
                            PCRData,
                            setPCRData,
                            sectionIdentifier,
                            field,
                            resultsAssessmentErrors,
                            [index],
                          )}
                        </React.Fragment>
                      ),
                    )}

                    <IoTrash
                      className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                      size={16}
                      onClick={() => {
                        onRemoveActivity(index)
                      }}
                    />
                  </div>
                  {index !== resultsAssessmentData.length - 1 && (
                    <Divider className="my-5" />
                  )}
                </span>
              ))}
            </div>
          </div>
          <SubmitButton
            title="Add activity"
            onSubmit={onAddActivity}
            className="mr-auto h-8"
          />
        </>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCRResultsAssessmentSection
