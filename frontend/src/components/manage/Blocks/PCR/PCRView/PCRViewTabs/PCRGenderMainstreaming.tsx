import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRResponse } from '../../interfaces'
import {
  SectionTitle,
  SubSectionTitle,
  detailItem,
  booleanDetailItem,
} from './ViewHelperComponents'
import {
  pcrFieldsMapping,
  pcTitleClassname,
  borderedValueClassname,
  pcTextareaClassname,
} from '../../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRGenderMainstreaming = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const ppData = filter(
    pcr.gender_mainstreamings,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )

  return (
    <>
      <SectionTitle>Gender mainstreaming</SectionTitle>
      <Tabs
        aria-label="gender-mainstreaming-view-tabs"
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
        <SubSectionTitle>Project cycle phases</SubSectionTitle>
        <div className="flex flex-col gap-y-6">
          {ppData.length > 0 ? (
            map(ppData, (pp, ppIndex) => (
              <div key={ppIndex}>
                <div className="rounded-t-lg bg-primary px-8 py-4">
                  {detailItem(
                    pcrFieldsMapping.project_preparation,
                    pp.project_preparation,
                    pcTitleClassname,
                  )}
                </div>
                <div className="rounded-b-lg border border-solid border-[#e5e7eb] bg-white p-5">
                  {booleanDetailItem(
                    pcrFieldsMapping.prefilled,
                    pp.prefilled,
                    borderedValueClassname,
                  )}
                  <Divider className="my-4" />
                  {detailItem(
                    pcrFieldsMapping.qualitative_description,
                    pp.qualitative_description,
                    pcTextareaClassname,
                  )}
                </div>
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

export default PCRGenderMainstreaming
