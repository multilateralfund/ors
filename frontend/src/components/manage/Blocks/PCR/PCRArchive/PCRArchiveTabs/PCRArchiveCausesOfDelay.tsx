import { useState } from 'react'

import {
  SectionTitle,
  SubSectionTitle,
  NrEntity,
  NoDataReported,
  detailItem,
} from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import { ArchivePCRResponse } from '../../interfaces'
import {
  pcTitleClassname,
  textareaClassname,
  borderedContainerClassname,
} from '../../constants'

import { filter, groupBy, keys, map, uniq } from 'lodash'
import { Tabs, Tab, Divider } from '@mui/material'
import cx from 'classnames'

const PCRArchiveCausesOfDelay = ({ pcr }: { pcr: ArchivePCRResponse }) => {
  const [crtTab, setCrtTab] = useState(0)

  const crtAgencies = uniq(
    map(pcr.delay_explanations, (dc) => dc.agency || '-'),
  )
  const crtAgency = crtAgencies[crtTab]

  const agencyData = filter(
    pcr.delay_explanations,
    (dc) => (dc.agency || '-') === crtAgency,
  )
  const dataByCategory = groupBy(agencyData, (dc) => dc.category || '-')
  const categories = keys(dataByCategory)

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
        {categories.length > 0 ? (
          <div className="flex flex-col gap-y-6">
            {map(categories, (category) => {
              const cdData = dataByCategory[category]

              return (
                <div key={category} className="flex">
                  <div className="w-1/4 bg-primary px-6 py-4">
                    {detailItem('Category', category, pcTitleClassname)}
                  </div>
                  <div
                    className={cx(
                      'w-3/4 bg-white px-6 py-4',
                      borderedContainerClassname,
                    )}
                  >
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      <SubSectionTitle>Delay cause</SubSectionTitle>
                      <SubSectionTitle>Measures to overcome</SubSectionTitle>
                    </div>
                    {map(cdData, (cd, cdIndex) => (
                      <div key={cd.id}>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex gap-3">
                            {NrEntity(cdIndex)}
                            <h4 className="m-0 text-lg font-semibold text-primary">
                              {cd.delay_cause || '-'}
                            </h4>
                          </div>
                          {detailItem(
                            'Measures to overcome',
                            cd.measures_to_overcome ?? '',
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

export default PCRArchiveCausesOfDelay
