import { Fragment, useContext, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRTextWidget, PCRTextAreaWidget } from './PCRWidgets'
import { formatErrors, hasSectionErrors } from '../utils'
import { ApiAgency } from '@ors/types/api_agencies'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { find, keys, map } from 'lodash'
import cx from 'classnames'

const PCRResultsAssessment = () => {
  const sectionIdentifier = 'results_assessment'
  const activityField = 'activities'

  const { PCRData, setPCRData, errors } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const activitiesData = sectionData[crtTab][activityField] || []
  const crtAgencyId = sectionData[crtTab].agency_id

  const { results_assessment: resultsAssessmentErrors } = errors
  const activitiesErrors = resultsAssessmentErrors[activityField]

  const agencyErrors = map(activitiesErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({ [activityField]: agencyErrors })

  const crtAgencies =
    agencies && agencies.length > 0
      ? map(
          sectionData,
          (entry) => find(agencies, (agency) => agency.id === entry.agency_id)!,
        )
      : []

  const TabLabel = ({ agency }: { agency: ApiAgency }) => {
    const tabErrors = {
      [activityField]: map(activitiesErrors[agency.id], 'errors'),
    }

    return (
      <div className="relative flex items-center justify-between gap-x-2">
        <div className="leading-tight">{agency.name}</div>
        {hasSectionErrors(tabErrors) && <SectionErrorIndicator errors={[]} />}
      </div>
    )
  }

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
        {map(crtAgencies, (agency) => (
          <Tab
            key={agency.name}
            aria-controls={agency.name}
            id={agency.name}
            label={<TabLabel {...{ agency }} />}
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
