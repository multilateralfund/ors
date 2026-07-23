import { Fragment, useContext, useState } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  PCRSelectWidget,
  PCRTextAreaWidget,
  PCRBooleanWidget,
} from './PCRWidgets'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { find, map } from 'lodash'
import cx from 'classnames'

const PCRGenderMainstreaming = () => {
  const sectionIdentifier = 'gender_mainstreaming'
  const ppField = 'project_phases'

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

  const onAddProjectPhase = (agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialProjectPhaseData = {
        project_phase_id: null,
        gender_policy: null,
        description: '',
      }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
            ? {
                ...data,
                [ppField]: [...data[ppField], initialProjectPhaseData],
              }
            : data,
        ),
      }
    }, ppField)
  }

  const onRemoveProjectPhase = (ppIndex: number, agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
            ? {
                ...data,
                [ppField]: data[ppField].filter(
                  (_, crtPpIndex) => crtPpIndex !== ppIndex,
                ),
              }
            : data,
        ),
      }
    }, ppField)
  }

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
                />
                <PCRBooleanWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="gender_policy"
                  errors={{}}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="description"
                  errors={{}}
                  indexes={[crtTab, ppIndex]}
                  subFields={['', ppField]}
                />
                <IoTrash
                  className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveProjectPhase(ppIndex, crtTab)
                  }}
                />
              </div>
              {ppIndex !== ppData.length - 1 && <Divider className="my-5" />}
            </Fragment>
          ))}
        </div>
        <SubmitButton
          title="Add project cycle phase"
          onSubmit={() => onAddProjectPhase(crtTab)}
          className={cx('mr-auto h-8', { 'mt-4': ppData.length > 0 })}
        />
      </div>
    </>
  )
}

export default PCRGenderMainstreaming
