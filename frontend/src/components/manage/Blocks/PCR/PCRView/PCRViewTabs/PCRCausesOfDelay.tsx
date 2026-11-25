import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  NrEntity,
  NoDataReported,
  detailItem,
} from './ViewHelperComponents'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  pcTitleClassname,
  textareaClassname,
  borderedContainerClassname,
} from '../../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, map } from 'lodash'
import cx from 'classnames'

const PCRCausesOfDelay = () => {
  const { agencies } = useContext(ProjectsDataContext)
  const { pcr: pcrData, agencyIds } = useContext(PCRDataContext)
  const pcr = pcrData.data as PCRResponse

  const [crtTab, setCrtTab] = useState(0)

  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const pcData = filter(pcr.delay_causes, (dc) => dc.agency_id === crtAgencyId)

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
              const cdData = pc.root_causes_of_delay || []

              return (
                <div key={pcIndex} className="flex flex-col lg:flex-row">
                  <div className="w-full bg-primary px-6 py-4 lg:w-1/4">
                    {detailItem(
                      'Delay clusters',
                      pc.delay_cluster?.name ?? '',
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
                                {cd.root_cause?.split('(')[0].trim() || '-'}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  <div
                    className={cx(
                      'w-full bg-white px-6 py-4 lg:w-3/4',
                      borderedContainerClassname,
                    )}
                  >
                    {cdData.length > 0 ? (
                      <>
                        <div className="mb-5 hidden grid-cols-2 items-start gap-4 md:grid">
                          <SubSectionTitle>
                            Description of the root causes of delay
                          </SubSectionTitle>
                          <SubSectionTitle>Action taken</SubSectionTitle>
                        </div>
                        {map(cdData, (cd, cdIndex) => (
                          <div key={cdIndex}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="flex gap-3">
                                {NrEntity(cdIndex)}
                                <h4 className="m-0 text-lg font-semibold text-primary">
                                  {cd.root_cause || '-'}
                                </h4>
                              </div>
                              <div className="hidden md:block" />
                              {detailItem(
                                pcrFieldsMapping.description_roots_causes_of_delay,
                                cd.description_roots_causes_of_delay,
                                {
                                  ...textareaClassname,
                                  containerClassname: cx(
                                    textareaClassname.containerClassname,
                                    'ml-9 max-lg:w-auto',
                                  ),
                                },
                              )}
                              <div className="ml-9 flex flex-col gap-1 md:ml-0">
                                <span
                                  className={cx(
                                    'text-[#4D4D4D] md:invisible',
                                    textareaClassname.labelClassname,
                                  )}
                                >
                                  {pcrFieldsMapping.action_taken}
                                </span>
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
