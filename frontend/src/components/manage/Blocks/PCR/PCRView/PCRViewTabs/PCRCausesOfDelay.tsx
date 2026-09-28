import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  detailItem,
} from './ViewHelperComponents'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  cdField,
  pcTitleClassname,
  pcTextareaClassname,
} from '../../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRCausesOfDelay = ({ pcr }: { pcr: PCRResponse }) => {
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
    (pc) => pc.agency_id === Number(crtAgencyId) && pc[cdField].length > 0,
  )

  return (
    <>
      <SectionTitle>Causes of delay</SectionTitle>
      <Tabs
        aria-label="causes-of-delay-view-tabs"
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
        <SubSectionTitle>Project components</SubSectionTitle>
        <div className="flex flex-col gap-y-6">
          {pcData.length > 0 ? (
            map(pcData, (pc, pcIndex) => {
              const cdData = pcData[pcIndex][cdField] || []

              return (
                <div key={pcIndex}>
                  <div className="rounded-t-lg bg-primary px-8 py-4">
                    {detailItem(
                      'Component',
                      pc.project_component_option?.name,
                      pcTitleClassname,
                    )}
                  </div>
                  <div className="rounded-b-lg border border-solid border-[#e5e7eb] bg-white p-5">
                    <SubSectionTitle>Causes of delay</SubSectionTitle>
                    {cdData.length > 0 ? (
                      map(cdData, (cd, cdIndex) => (
                        <div key={cdIndex}>
                          <div className="flex gap-5 pt-4">
                            <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-[#EBFF00]">
                              {cdIndex + 1}
                            </div>
                            <div>
                              <h4 className="m-0 mb-3 text-lg font-semibold text-primary">
                                {cd.delay?.name || '-'}
                              </h4>
                              {detailItem(
                                pcrFieldsMapping.description,
                                cd.description,
                                pcTextareaClassname,
                              )}
                            </div>
                          </div>
                          {cdIndex !== cdData.length - 1 && (
                            <Divider className="my-4" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-3xl text-primary">-</div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-3xl text-primary">-</div>
          )}
        </div>
      </div>
    </>
  )
}

export default PCRCausesOfDelay
