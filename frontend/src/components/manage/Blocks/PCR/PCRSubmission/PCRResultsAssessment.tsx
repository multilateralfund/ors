import { Fragment, useContext } from 'react'

import {
  SubmitButton,
  NavigationButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRTextAreaWidget } from './PCRWidgets'
import { PCRSectionProps, PCRResultsAssessmentType } from '../interfaces'
import { initialResultsAssessmentEntry } from '../constants'

import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import { keys, map } from 'lodash'
import cx from 'classnames'

const PCRResultsAssessment = ({ setCurrentTab }: PCRSectionProps) => {
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

  console.log(sectionData)

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
                className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
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
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCRResultsAssessment
