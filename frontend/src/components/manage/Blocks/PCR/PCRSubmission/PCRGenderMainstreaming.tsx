import { Fragment, useContext, useState } from 'react'

import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { SubSectionTitle } from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { ppField, projectPhaseOptions, booleanFieldsOpts } from '../constants'
import { getSectionAgencies, formatErrors } from '../utils'

import { Tabs, Tab, Divider } from '@mui/material'
import { map } from 'lodash'

const PCRGenderMainstreaming = () => {
  const sectionIdentifier = 'gender_mainstreaming'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, errors } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const ppData = sectionData[crtTab][ppField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { gender_mainstreaming: genderMainstreamingErrors } = errors
  const ppErrors = genderMainstreamingErrors[ppField]

  const agencyErrors = map(ppErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({ [ppField]: agencyErrors })

  return (
    <>
      <Tabs
        aria-label="gender-mainstreaming-tabs"
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
              <TabLabel field={ppField} errors={ppErrors} {...{ agency }} />
            }
          />
        ))}
      </Tabs>
      <div className="border-0 border-t border-solid border-primary py-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <SubSectionTitle>Project cycle phases</SubSectionTitle>
        <div className="flex flex-col gap-y-4">
          {map(ppData, (_, ppIndex) => (
            <Fragment key={ppIndex}>
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="project_preparation"
                  options={projectPhaseOptions}
                  errors={agencyErrors}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                  disabled={true}
                />
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="prefilled"
                  options={booleanFieldsOpts}
                  errors={agencyErrors}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="qualitative_description"
                  errors={agencyErrors}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                  rows={2}
                />
              </div>
              {ppIndex !== ppData.length - 1 && <Divider className="my-5" />}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  )
}

export default PCRGenderMainstreaming
