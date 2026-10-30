import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  NoDataReported,
  detailItem,
} from './ViewHelperComponents'
import { borderedContainerClassname, pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline } from 'react-icons/io5'
import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, map } from 'lodash'
import cx from 'classnames'

const PCRDocumentation = () => {
  const { agencies } = useContext(ProjectsDataContext)
  const { pcr: pcrData, agencyIds } = useContext(PCRDataContext)
  const pcr = pcrData.data as PCRResponse

  const [crtTab, setCrtTab] = useState(0)

  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const evidencesData = filter(
    pcr.supporting_evidences,
    ({ agency_id }) => agency_id === crtAgencyId,
  )

  return (
    <>
      <SectionTitle>Other supporting evidence</SectionTitle>
      <Tabs
        aria-label="supporting-evidences-view-tabs"
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
        <div
          className={cx(
            'flex flex-col bg-white p-6',
            borderedContainerClassname,
          )}
        >
          {evidencesData.length === 0 ? (
            <NoDataReported text="No files available." />
          ) : (
            evidencesData.map((file, index) => {
              const fileName = file.filename
              const downloadUrl = file.file

              return (
                <div key={index}>
                  <div className="flex flex-wrap gap-x-7 gap-y-3">
                    <a
                      className="flex gap-2.5 text-secondary no-underline md:w-[45%]"
                      download={fileName}
                      href={formatApiUrl(downloadUrl)}
                    >
                      <IoDownloadOutline className="min-h-5 min-w-5" />
                      <span className="text-lg font-medium">{fileName}</span>
                    </a>
                    <div className="md:w-[45%]">
                      {detailItem(pcrFieldsMapping.section_id, file.section)}
                    </div>
                  </div>
                  {index !== evidencesData.length - 1 && (
                    <Divider className="my-4" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default PCRDocumentation
