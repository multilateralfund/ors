import { Fragment, useContext, useState } from 'react'

import { SectionTitle } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { detailItem } from './ViewHelperComponents'
import { initialActivitiesData, pcrFieldsMapping } from '../../constants'
import { PCRResponse, Activity } from '../../interfaces'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRResultsAssessment = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const activitesData = filter(
    pcr.activities,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )

  return (
    <>
      <Tabs
        aria-label="results-assessment-view-tabs"
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
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <SectionTitle>Activities</SectionTitle>
        <div className="flex flex-col gap-y-4">
          {activitesData.length > 0
            ? map(activitesData, (activity, activityIndex) => (
                <Fragment key={activityIndex}>
                  {detailItem(
                    pcrFieldsMapping.activity_title,
                    activity.activity_title,
                    { detailClassname: 'self-start' },
                  )}
                  <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                    {map(
                      keys(initialActivitiesData).slice(1),
                      (field: keyof Activity, fieldIndex) => (
                        <Fragment key={fieldIndex}>
                          {detailItem(
                            pcrFieldsMapping[field],
                            activity[field],
                            { detailClassname: 'self-start' },
                          )}
                        </Fragment>
                      ),
                    )}
                  </div>
                  {activityIndex !== activitesData.length - 1 && (
                    <Divider className="my-1" />
                  )}
                </Fragment>
              ))
            : '-'}
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
