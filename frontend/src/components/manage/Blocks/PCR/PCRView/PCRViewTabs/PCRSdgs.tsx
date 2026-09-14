import { Fragment, useContext, useState } from 'react'

import { SectionTitle } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { detailItem } from './ViewHelperComponents'
import { pcrFieldsMapping } from '../../constants'
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
  const sdgsData = agencySdgsData[0].goals

  return (
    <>
      <Tabs
        aria-label="sdgs-view-tabs"
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
        <SectionTitle>SDGs</SectionTitle>
        <div className="flex flex-col gap-y-4 px-5">
          {sdgsData.length > 0
            ? map(sdgsData, (sdg, sdgIndex) => (
                <Fragment key={sdgIndex}>
                  {detailItem(pcrFieldsMapping.goal_id, sdg.goal)}
                  {detailItem(
                    pcrFieldsMapping.description,
                    sdg.description,
                    'self-start whitespace-nowrap',
                  )}
                  {sdgIndex !== sdgsData.length - 1 && (
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

export default PCRSdgs
