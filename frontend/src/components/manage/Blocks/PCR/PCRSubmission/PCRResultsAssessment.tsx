import { Fragment, useContext } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRTextAreaWidget } from './PCRWidgets'
import { initialResultsAssessmentEntry } from '../constants'
import { PCRResultsAssessmentType } from '../interfaces'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { keys, map } from 'lodash'
import cx from 'classnames'

const PCRResultsAssessment = () => {
  const { PCRData, setPCRData } = useContext(PCRDataContext)

  const sectionIdentifier = 'results_assessment'
  const sectionData = PCRData[sectionIdentifier] || []

  const onAddActivity = () => {
    setPCRData((prevData) => {
      const prevSectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: [
          ...prevSectionData,
          initialResultsAssessmentEntry,
        ],
      }
    }, sectionIdentifier)
  }

  const onRemoveActivity = (index: number) => {
    setPCRData((prevData) => {
      const prevSectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: prevSectionData.filter((_, idx) => idx !== index),
      }
    }, sectionIdentifier)
  }

  return (
    <>
      <div className="flex flex-col">
        {map(sectionData, (_, index) => (
          <span
            key={index}
            className={cx({ 'mb-5': index === sectionData.length - 1 })}
          >
            <div className="align-center flex flex-row flex-wrap gap-x-7">
              {map(keys(initialResultsAssessmentEntry), (field, fieldIndex) => (
                <Fragment key={fieldIndex}>
                  <PCRTextAreaWidget<PCRResultsAssessmentType>
                    {...{ PCRData, setPCRData, sectionIdentifier, field }}
                    errors={{}}
                    indexes={[index]}
                  />
                </Fragment>
              ))}
              <IoTrash
                className="mt-10 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                size={16}
                onClick={() => {
                  onRemoveActivity(index)
                }}
              />
            </div>
            {index !== sectionData.length - 1 && <Divider className="my-5" />}
          </span>
        ))}
      </div>
      <SubmitButton
        title="Add activity"
        onSubmit={onAddActivity}
        className="mr-auto h-8"
      />
    </>
  )
}

export default PCRResultsAssessment
