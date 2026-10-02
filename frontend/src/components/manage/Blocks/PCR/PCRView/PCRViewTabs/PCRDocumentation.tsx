import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  detailItem,
} from './ViewHelperComponents'
import { pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline } from 'react-icons/io5'
import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, keys, map } from 'lodash'

const PCRDocumentation = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const evidencesData = filter(
    pcr.supporting_evidences,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
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
      <div className="border-0 border-t border-solid border-primary py-6">
        <SubSectionTitle className="!mb-2">Attachments</SubSectionTitle>
        <div className="flex flex-col rounded-lg border border-solid border-[#e5e7eb] bg-white p-5">
          {evidencesData.length === 0 ? (
            <p className="m-1 ml-0 text-lg text-gray-500">No files available</p>
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
