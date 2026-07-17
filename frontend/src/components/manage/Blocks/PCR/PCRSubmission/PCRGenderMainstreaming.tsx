import { Fragment, useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  PCRSelectWidget,
  PCRTextAreaWidget,
  PCRBooleanWidget,
} from './PCRWidgets'

import { Tabs, Tab, Divider } from '@mui/material'
import { find, map } from 'lodash'

const PCRGenderMainstreaming = () => {
  const sectionIdentifier = 'gender_mainstreaming'
  const ppField = 'project_phase'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, projectPhaseOptions } =
    useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const ppData = sectionData[crtTab][ppField] || []

  const crtAgencies = map(
    sectionData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  console.log(PCRData)

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
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-col gap-y-4">
          {map(ppData, (_, ppIndex) => (
            <Fragment key={ppIndex}>
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="project_phase_id"
                  options={projectPhaseOptions}
                  errors={{}}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                  disabled={true}
                />
                <PCRBooleanWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="meets_criteria"
                  errors={{}}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                  disabled={true}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="description"
                  errors={{}}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
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
