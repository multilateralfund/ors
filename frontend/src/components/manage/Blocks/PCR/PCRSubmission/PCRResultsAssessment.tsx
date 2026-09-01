import { Fragment, useContext, useState } from 'react'

import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { TabLabel, PCRTextWidget, PCRTextAreaWidget } from './PCRWidgets'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, keys, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import cx from 'classnames'

const PCRResultsAssessment = () => {
  const sectionIdentifier = 'results_assessment'
  const activityField = 'activities'

  const { PCRData, setPCRData, errors, setErrors } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const activitiesData = sectionData[crtTab][activityField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { results_assessment: resultsAssessmentErrors } = errors
  const activitiesErrors = resultsAssessmentErrors[activityField]

  const agencyErrors = map(activitiesErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({ [activityField]: agencyErrors })

  const initialActivitiesData = {
    activity_title: '',
    type_of_activity: '',
    type_of_sector: '',
    planned_output: '',
    actual_activity_output: '',
    additional_remarks: '',
  }

  const onAddActivity = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [activityField]: [
                  ...data[activityField],
                  initialActivitiesData,
                ],
              }
            : data,
        ),
      }
    }, activityField)
  }

  const onRemoveActivity = (activityIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [activityField]: data[activityField].filter(
                  (_, crtActivityIndex) => crtActivityIndex !== activityIndex,
                ),
              }
            : data,
        ),
      }
    }, activityField)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        activityField,
        crtAgencyId,
        activityIndex,
      )

      return {
        ...prevData,
        [activityField]: filter(
          prevData[activityField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  return (
    <>
      <Tabs
        aria-label="results-assessment-tabs"
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={crtTab}
        onChange={(_, newValue) => {
          setCrtTab(newValue)
        }}
      >
        {map(crtAgencies, (agency) => (
          <Tab
            key={agency.name}
            aria-controls={agency.name}
            id={agency.name}
            label={
              <TabLabel
                field={activityField}
                errors={activitiesErrors}
                {...{ agency }}
              />
            }
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="flex flex-col gap-y-4">
          {map(activitiesData, (_, activityIndex) => (
            <Fragment key={activityIndex}>
              <PCRTextWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="activity_title"
                errors={agencyErrors}
                indexes={[crtTab, activityIndex]}
                subFields={['', activityField]}
              />
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                {map(
                  keys(initialActivitiesData).slice(1),
                  (field, fieldIndex) => (
                    <Fragment key={fieldIndex}>
                      <PCRTextAreaWidget
                        {...{ PCRData, setPCRData, sectionIdentifier, field }}
                        errors={agencyErrors}
                        indexes={[crtTab, activityIndex]}
                        subFields={['', activityField]}
                      />
                    </Fragment>
                  ),
                )}
                <IoTrash
                  className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveActivity(activityIndex)
                  }}
                />
              </div>
              {activityIndex !== activitiesData.length - 1 && (
                <Divider className="my-5" />
              )}
            </Fragment>
          ))}
          <SubmitButton
            title="Add activity"
            onSubmit={onAddActivity}
            className={cx('mr-auto h-8', { 'mt-4': activitiesData.length > 0 })}
          />
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
