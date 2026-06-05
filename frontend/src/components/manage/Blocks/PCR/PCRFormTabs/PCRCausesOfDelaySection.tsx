import {
  PCRData,
  PCROverviewSectionProps,
  PCRCausesOfDelay,
} from '../interfaces'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import _, { find, keys, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider, Tab } from '@mui/material'
import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import React, { useContext, useState } from 'react'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { Tabs } from '@mui/material'
import {
  initialProjectElementCauseOfDelay,
  projectElementOpts,
} from '../constants'

const PCRCausesOfDelaySection = ({
  PCRData,
  setPCRData,
  errors,
  setCurrentTab,
}: PCROverviewSectionProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'causes_of_delay'
  const projectElementField = 'project_element'

  const causesOfDelayData = PCRData[sectionIdentifier] || []

  const onAddProjectElement = (index: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index
            ? {
                ...agency,
                [projectElementField]: [
                  ...agency[projectElementField],
                  initialProjectElementCauseOfDelay,
                ],
              }
            : agency,
        ),
      }
    }, sectionIdentifier)
  }

  const onRemoveProjectElement = (index: number, index2: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index2
            ? {
                ...agency,
                [projectElementField]: agency[projectElementField].filter(
                  (_, index3) => index3 !== index,
                ),
              }
            : agency,
        ),
      }
    }, sectionIdentifier)
  }

  const { agencies } = useContext(ProjectsDataContext)

  console.log(causesOfDelayData)
  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    causesOfDelayData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <>
          <div>
            <Tabs
              aria-label="causes-of-delay-tabs"
              className="sectionsTabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{
                className: 'h-0',
                style: { transitionDuration: '150ms' },
              }}
              value={crtAgency}
              onChange={(_, newValue) => {
                setCrtAgency(newValue)
              }}
            >
              {crtAgencies.map((agency) => (
                <Tab
                  key={agency}
                  aria-controls={agency}
                  id={agency}
                  label={agency}
                />
              ))}
            </Tabs>
            <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
              {crtAgencies
                .filter((_, index) => index === crtAgency)
                .map((_, indexAgency) => {
                  const projectElementData =
                    causesOfDelayData[crtAgency][projectElementField] || []

                  console.log({ projectElementData, crtAgency })
                  return (
                    <span key={crtAgency}>
                      <div className="flex flex-col gap-y-2">
                        <div className="flex flex-col flex-wrap gap-x-20">
                          {map(projectElementData, (_, index) => (
                            <span key={index}>
                              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                                {widgets['drop_down']<
                                  PCRData,
                                  PCRCausesOfDelay
                                >(
                                  PCRData,
                                  setPCRData,
                                  sectionIdentifier,
                                  'project_element_id',
                                  projectElementOpts,
                                  errors,
                                )}

                                <IoTrash
                                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                                  size={16}
                                  onClick={() => {
                                    onRemoveProjectElement(index, crtAgency)
                                  }}
                                />
                              </div>
                              {index !== projectElementData.length - 1 && (
                                <Divider className="my-5" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      <SubmitButton
                        title="Add project element"
                        onSubmit={() => onAddProjectElement(crtAgency)}
                        className="mr-auto h-8"
                      />
                    </span>
                  )
                })}
            </div>
          </div>
        </>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton setCurrentTab={setCurrentTab} />
      </div>
    </>
  )
}

export default PCRCausesOfDelaySection
