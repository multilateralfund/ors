import { useContext, useState } from 'react'

import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { detailItem } from './ViewHelperComponents'
import { pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { IoDownloadOutline } from 'react-icons/io5'
import { filter, find, keys, map } from 'lodash'
import { Tabs, Tab } from '@mui/material'
import { TbFiles } from 'react-icons/tb'

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
      <Tabs
        aria-label="supporting-evidences-view-tabs"
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
        <div className="flex flex-col">
          <HeaderWithIcon title="File attachments" Icon={TbFiles} />
          <div className="mt-3">
            {evidencesData.length === 0 ? (
              <p className="m-1 ml-0 text-lg text-gray-500">
                No files available
              </p>
            ) : (
              evidencesData.map((file, index) => {
                const fileName = file.filename
                const downloadUrl = file.file

                return (
                  <div
                    key={index}
                    className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2"
                  >
                    <a
                      className="flex gap-2.5 text-secondary no-underline"
                      download={fileName}
                      href={formatApiUrl(downloadUrl)}
                    >
                      <IoDownloadOutline className="mb-1 min-h-5 min-w-5" />
                      <span className="text-lg font-medium">{fileName}</span>
                    </a>
                    {detailItem(pcrFieldsMapping.section_id, file.section)}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PCRDocumentation
