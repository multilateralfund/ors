import { Fragment, useContext, useState } from 'react'

import { SectionTitle } from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { detailItem, booleanDetailItem } from './ViewHelperComponents'
import { pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'

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
      <Tabs
        aria-label="gender-mainstreaming-view-tabs"
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
        <SectionTitle>Gender mainstreamings</SectionTitle>
        <div className="flex flex-col">
          {ppData.length > 0
            ? map(ppData, (pp, ppIndex) => (
                <Fragment key={ppIndex}>
                  <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                    {detailItem(
                      pcrFieldsMapping.project_preparation,
                      pp.project_preparation,
                    )}
                    {booleanDetailItem(
                      pcrFieldsMapping.prefilled,
                      pp.prefilled,
                    )}
                    {detailItem(
                      pcrFieldsMapping.qualitative_description,
                      pp.qualitative_description,
                      { detailClassname: 'self-start' },
                    )}
                  </div>
                  {ppIndex !== ppData.length - 1 && (
                    <Divider className="my-5" />
                  )}
                </Fragment>
              ))
            : '-'}
        </div>
      </div>
    </>
  )
}

export default PCRGenderMainstreaming
