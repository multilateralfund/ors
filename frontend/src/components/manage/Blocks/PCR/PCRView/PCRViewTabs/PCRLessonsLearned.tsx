import { Fragment, useContext, useState } from 'react'

import { SectionTitle } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { detailItem } from './ViewHelperComponents'
import { llField, pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRLessonsLearned = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const pcData = filter(
    pcr.project_components,
    (pc) => pc.agency_id === Number(crtAgencyId) && pc[llField].length > 0,
  )

  return (
    <>
      <Tabs
        aria-label="lessons-learned-view-tabs"
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
        <SectionTitle>Project components</SectionTitle>
        <div className="flex flex-col gap-y-4">
          {pcData.length > 0
            ? map(pcData, (pc, pcIndex) => {
                const llData = pcData[pcIndex][llField] || []

                return (
                  <div key={pcIndex} className="flex items-center gap-2">
                    <div className="relative flex flex-1 flex-col gap-y-4 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
                      {detailItem(
                        pcrFieldsMapping.project_component_option_id,
                        pc.project_component_option?.name,
                      )}
                      <div className="mt-4">
                        <SectionTitle>Lessons learned</SectionTitle>
                        <div className="flex flex-col">
                          {llData.length > 0
                            ? map(llData, (ll, llIndex) => (
                                <Fragment key={llIndex}>
                                  <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                                    {detailItem(
                                      pcrFieldsMapping.lesson_id,
                                      ll.lesson?.name,
                                    )}
                                    {detailItem(
                                      pcrFieldsMapping.description,
                                      ll.description,
                                      { detailClassname: 'self-start' },
                                    )}
                                  </div>
                                  {llIndex !== llData.length - 1 && (
                                    <Divider className="my-5" />
                                  )}
                                </Fragment>
                              ))
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            : '-'}
        </div>
      </div>
    </>
  )
}

export default PCRLessonsLearned
