import { useContext, useState } from 'react'

import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRFilesViewer from './PCRFilesViewer'
import PCRFilesInput from './PCRFilesInput'
import { TabLabel } from './PCRWidgets'
import { getSectionAgencies, formatErrors } from '../utils'
import { supportingEvidencesField } from '../constants'

import { Tab, Tabs } from '@mui/material'
import { map } from 'lodash'

const PCRDocumentation = () => {
  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, errors } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[supportingEvidencesField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { supporting_evidences: supportingEvidencesErrors } = errors
  const evidencesErrors = supportingEvidencesErrors[supportingEvidencesField]

  const agencyErrors = map(evidencesErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({
    [supportingEvidencesField]: agencyErrors,
  })

  return (
    <>
      <Tabs
        aria-label="supporting-evidences-tabs"
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
          <Tab
            key={agency.name}
            aria-controls={agency.name}
            id={agency.name}
            label={
              <TabLabel
                field={supportingEvidencesField}
                errors={evidencesErrors}
                {...{ agency }}
              />
            }
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="flex w-full flex-col gap-4">
          <PCRFilesViewer errors={agencyErrors} {...{ crtTab, crtAgencyId }} />
          <PCRFilesInput {...{ crtTab }} />
        </div>
      </div>
    </>
  )
}

export default PCRDocumentation
