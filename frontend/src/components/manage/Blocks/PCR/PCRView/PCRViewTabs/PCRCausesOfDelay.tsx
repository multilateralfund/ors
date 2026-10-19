import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  NoDataReported,
  detailItem,
} from './ViewHelperComponents'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  cdField,
  pcTitleClassname,
  textareaClassname,
  borderedContainerClassname,
} from '../../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'
import cx from 'classnames'

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
      <div className="border-0 border-t border-solid border-primary pt-6">
        {pcData.length > 0 ? (
          <div className="flex flex-col gap-y-6">
            {map(pcData, (pc, pcIndex) => {
              const cdData = pcData[pcIndex][cdField] || []

              return (
                <div key={pcIndex} className="flex">
                  <div className="w-1/4 bg-primary px-6 py-4">
                    {detailItem(
                      'Delay clusters',
                      pc.project_component_option?.name,
                      pcTitleClassname,
                    )}
                    {cdData.length > 0 && (
                      <>
                        <Divider className="my-4 opacity-20" />
                        {map(cdData, (cd, cdIndex) => (
                          <div key={cdIndex} className="mb-2">
                            <div className="flex gap-3">
                              <div className="mt-1 flex h-5 min-h-5 w-5 min-w-5 items-center justify-center rounded-full bg-mlfs-hlYellow text-lg font-bold text-primary">
                                {cdIndex + 1}
                              </div>
                              <h4 className="m-0 text-lg font-normal text-white">
                                {cd.delay?.name || '-'}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <div
                    className={cx(
                      'w-3/4 bg-white px-6 py-4',
                      borderedContainerClassname,
                    )}
                  >
                    {cdData.length > 0 ? (
                      <>
                        <div className="mb-5 grid grid-cols-2 gap-4">
                          <SubSectionTitle>
                            Description of the root causes of delay
                          </SubSectionTitle>
                          <SubSectionTitle>Action taken</SubSectionTitle>
                        </div>
                        {map(cdData, (cd, cdIndex) => (
                          <div key={cdIndex}>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex gap-3">
                                <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-mlfs-hlYellow">
                                  {cdIndex + 1}
                                </div>
                                <h4 className="m-0 text-lg font-semibold text-primary">
                                  {cd.delay?.name || '-'}
                                </h4>
                              </div>
                              <div />
                              {detailItem(
                                pcrFieldsMapping.description,
                                cd.description,
                                {
                                  ...textareaClassname,
                                  containerClassname: cx(
                                    textareaClassname.containerClassname,
                                    'ml-9',
                                  ),
                                },
                              )}
                              {detailItem(
                                pcrFieldsMapping.action_taken,
                                cd.action_taken,
                                {
                                  ...textareaClassname,
                                  containerClassname: cx(
                                    textareaClassname.containerClassname,
                                    'bg-[#edf1f4] rounded !w-full py-3 px-4',
                                  ),
                                },
                                false,
                                false,
                              )}
                            </div>
                            {cdIndex !== cdData.length - 1 && (
                              <Divider className="-mx-6 my-4" />
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <NoDataReported text="No data reported." />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={cx('bg-white p-6', borderedContainerClassname)}>
            <NoDataReported text="No data reported." />
          </div>
        )}
      </div>
    </>
  )
}

export default PCRCausesOfDelay
