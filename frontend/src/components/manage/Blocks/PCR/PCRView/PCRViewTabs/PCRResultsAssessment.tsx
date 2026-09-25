import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  detailItem,
} from './ViewHelperComponents'
import { pcrFieldsMapping, activitiesTextareaClassname } from '../../constants'
import { PCRResponse } from '../../interfaces'

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

  const updatedClassname = {
    ...activitiesTextareaClassname,
    labelClassname: activitiesTextareaClassname.labelClassname + ' w-28',
  }

  const outputFieldsClassname = {
    ...activitiesTextareaClassname,
    containerClassname:
      activitiesTextareaClassname.containerClassname +
      ' !flex-col !gap-0 !p-0 w-auto',
    labelClassname: activitiesTextareaClassname.labelClassname + ' !mt-0',
  }

  return (
    <>
      <SectionTitle>Project results overall assessment</SectionTitle>
      <Tabs
        aria-label="results-assessment-view-tabs"
        className="sectionsTabs mt-6"
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
      <div className="border-0 border-t border-solid border-primary py-6">
        <SubSectionTitle>Activities</SubSectionTitle>
        <div className="flex flex-col gap-y-6">
          {activitesData.length > 0
            ? map(activitesData, (activity, activityIndex) => (
                <div key={activityIndex}>
                  <div className="rounded-t-lg bg-primary px-8 py-4">
                    {detailItem('', activity.activity_title, {
                      valueClassname: 'text-white !font-bold !text-3xl',
                    })}
                  </div>
                  <div className="rounded-b-lg border border-solid border-[#e5e7eb] bg-white p-5">
                    {detailItem(
                      pcrFieldsMapping.type_of_activity,
                      activity.type_of_activity,
                      updatedClassname,
                    )}
                    <Divider className="my-4 w-[65%]" />
                    {detailItem(
                      pcrFieldsMapping.type_of_sector,
                      activity.type_of_sector,
                      updatedClassname,
                    )}
                    <div className="my-2 grid grid-cols-1 gap-6 rounded-lg bg-[#F5F5F5] p-6 lg:grid-cols-2">
                      {detailItem(
                        pcrFieldsMapping.planned_output,
                        activity.planned_output,
                        outputFieldsClassname,
                        true,
                      )}
                      {detailItem(
                        pcrFieldsMapping.actual_activity_output,
                        activity.actual_activity_output,
                        outputFieldsClassname,
                        true,
                      )}
                    </div>
                    {detailItem(
                      pcrFieldsMapping.additional_remarks,
                      activity.additional_remarks,
                      updatedClassname,
                    )}
                  </div>
                </div>
              ))
            : '-'}
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
