import { Fragment, useContext, useState } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRTextWidget, PCRTextAreaWidget } from './PCRWidgets'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { find, keys, map } from 'lodash'
import cx from 'classnames'

const PCRResultsAssessment = () => {
  const sectionIdentifier = 'results_assessment'
  const activityField = 'activities'

  const { PCRData, setPCRData } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const activitiesData = sectionData[crtTab][activityField] || []

  const crtAgencies = map(
    sectionData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  const initialActivitiesData = {
    activity_title: '',
    type_of_activity: '',
    type_of_sector: '',
    planned_output: '',
    actual_activity_output: '',
    additional_remarks: '',
  }

  const onAddActivity = (agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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

  const onRemoveActivity = (activityIndex: number, agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-col gap-y-4">
          {map(activitiesData, (_, activityIndex) => (
            <Fragment key={activityIndex}>
              <PCRTextWidget
                {...{ PCRData, setPCRData, sectionIdentifier }}
                field="activity_title"
                errors={{}}
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
                        errors={{}}
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
                    onRemoveActivity(activityIndex, crtTab)
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
            onSubmit={() => onAddActivity(crtTab)}
            className={cx('mr-auto h-8', { 'mt-4': activitiesData.length > 0 })}
          />
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
