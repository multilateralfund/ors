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
  textareaClassname,
  borderedContainerClassname,
} from '../../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { find, keys, map } from 'lodash'
import cx from 'classnames'

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

  const llData =
    find(pcr.learned_lessons, (ll) => ll.agency_id === Number(crtAgencyId))
      ?.lessons ?? []

  return (
    <>
      <SectionTitle>Lessons learned</SectionTitle>
      <Tabs
        aria-label="lessons-learned-view-tabs"
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
        {llData.length > 0 ? (
          <div className="flex">
            <div className="w-1/4 bg-primary px-6 py-4">
              <span className="text-lg uppercase text-mlfs-hlYellow">
                Lessons learned
              </span>
              <Divider className="my-4 opacity-20" />
              {map(llData, (ll, llIndex) => (
                <div key={llIndex} className="mb-2">
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-5 min-h-5 w-5 min-w-5 items-center justify-center rounded-full bg-mlfs-hlYellow text-lg font-bold text-primary">
                      {llIndex + 1}
                    </div>
                    <h4 className="m-0 text-lg font-normal text-white">
                      {ll.lesson || '-'}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
            <div
              className={cx(
                'w-3/4 bg-white px-6 py-4',
                borderedContainerClassname,
              )}
            >
              <SubSectionTitle className="mb-5">
                Lessons learned
              </SubSectionTitle>
              {map(llData, (ll, llIndex) => (
                <div key={llIndex}>
                  <div className="flex gap-3">
                    <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-mlfs-hlYellow">
                      {llIndex + 1}
                    </div>
                    <div>
                      <h4 className="m-0 mb-3 text-lg font-semibold text-primary">
                        {ll.lesson || '-'}
                      </h4>
                      {detailItem(
                        pcrFieldsMapping.description,
                        ll.description,
                        textareaClassname,
                      )}
                    </div>
                  </div>
                  {llIndex !== llData.length - 1 && (
                    <Divider className="-mx-6 my-4" />
                  )}
                </div>
              ))}
            </div>
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

export default PCRLessonsLearned
