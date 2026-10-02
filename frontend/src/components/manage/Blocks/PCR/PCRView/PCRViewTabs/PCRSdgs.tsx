import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  detailItem,
} from './ViewHelperComponents'
import { pcrFieldsMapping, sdgsTextareaClassname } from '../../constants'
import { PCRResponse } from '../../interfaces'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRSdgs = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const agencySdgsData = filter(
    pcr.sustainable_development_goals,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )
  const sdgsData = agencySdgsData.length > 0 ? agencySdgsData[0].goals : []

  return (
    <>
      <SectionTitle>SDGs</SectionTitle>
      <Tabs
        aria-label="sdgs-view-tabs"
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
        <SubSectionTitle>Goals</SubSectionTitle>
        <div className="flex flex-col rounded-lg border border-solid border-[#e5e7eb] bg-white p-5">
          {sdgsData.length > 0 ? (
            map(sdgsData, (sdg, sdgIndex) => (
              <div key={sdgIndex}>
                <div className="flex flex-wrap gap-x-7 gap-y-6">
                  <img
                    src={`/images/pcr/sdgs/goal${sdg.goal_id}.png`}
                    className="mt-1 h-32 w-32"
                  />
                  <div className="md:w-[70%]">
                    {detailItem('', sdg.goal, {
                      containerClassname: '!gap-0 mb-3',
                    })}
                    {detailItem(
                      pcrFieldsMapping.description,
                      sdg.description,
                      sdgsTextareaClassname,
                    )}
                  </div>
                </div>
                {sdgIndex !== sdgsData.length - 1 && (
                  <Divider className="my-4" />
                )}
              </div>
            ))
          ) : (
            <div className="text-3xl text-primary">-</div>
          )}
        </div>
      </div>
    </>
  )
}

export default PCRSdgs
