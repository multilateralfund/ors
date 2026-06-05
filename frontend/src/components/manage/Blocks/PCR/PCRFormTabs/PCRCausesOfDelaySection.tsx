import {
  PCRData,
  PCROverviewSectionProps,
  PCRCausesOfDelay,
} from '../interfaces'
import { SubmitButton } from '../../ProjectsListing/HelperComponents'
import { widgets } from './SpecificFieldsHelpers'

import { find, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider, Tab } from '@mui/material'
import { NavigationButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { useContext, useState } from 'react'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { Tabs } from '@mui/material'
import {
  causeOfDelayOpts,
  initialCauseOfDelay,
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
  const causeOfDelayField = 'cause_of_delay'

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
    }, projectElementField)
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
    }, projectElementField)
  }

  const onAddCauseOfDelay = (index: number, index2: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index
            ? {
                ...agency,
                [projectElementField]: agency[projectElementField].map(
                  (proj_elem, indexData2) =>
                    indexData2 === index2
                      ? {
                          ...proj_elem,
                          [causeOfDelayField]: [
                            ...proj_elem[causeOfDelayField],
                            initialCauseOfDelay,
                          ],
                        }
                      : proj_elem,
                ),
              }
            : agency,
        ),
      }
    }, causeOfDelayField)
  }

  const onRemoveCauseOfDelay = (
    index: number,
    index2: number,
    index3: number,
  ) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((agency, indexData) =>
          indexData === index3
            ? {
                ...agency,
                [projectElementField]: map(
                  agency[projectElementField],
                  (projElem, indexData2) =>
                    indexData2 === index2
                      ? {
                          ...projElem,
                          [causeOfDelayField]: projElem[
                            causeOfDelayField
                          ].filter((_, index5) => index5 !== index),
                        }
                      : projElem,
                ),
              }
            : agency,
        ),
      }
    }, causeOfDelayField)
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
                .map(() => {
                  const projectElementData =
                    causesOfDelayData[crtAgency][projectElementField] || []

                  console.log({ projectElementData })
                  return (
                    <span key={crtAgency}>
                      <div className="flex flex-col gap-y-2">
                        <div className="flex flex-col flex-wrap gap-x-20">
                          {map(projectElementData, (_, index) => {
                            const causeOfDelayData =
                              causesOfDelayData[crtAgency][projectElementField][
                                index
                              ][causeOfDelayField] || []

                            return (
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
                                    crtAgency,
                                    undefined,
                                    index,
                                    'project_element',
                                  )}

                                  <IoTrash
                                    className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                                    size={16}
                                    onClick={() => {
                                      onRemoveProjectElement(index, crtAgency)
                                    }}
                                  />
                                  <span key={crtAgency}>
                                    <div className="flex flex-col gap-y-2">
                                      <div className="flex flex-col flex-wrap gap-x-20">
                                        {map(
                                          causeOfDelayData,
                                          (_, index_cause_of_delay) => (
                                            <span key={index_cause_of_delay}>
                                              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                                                {widgets['drop_down']<
                                                  PCRData,
                                                  PCRCausesOfDelay
                                                >(
                                                  PCRData,
                                                  setPCRData,
                                                  sectionIdentifier,
                                                  'cause_of_delay_id',
                                                  causeOfDelayOpts,
                                                  errors,
                                                  crtAgency,
                                                  undefined,
                                                  index,
                                                  'project_element',
                                                  index_cause_of_delay,
                                                  'cause_of_delay',
                                                )}
                                                {widgets['text_area']<
                                                  PCRData,
                                                  PCRCausesOfDelay
                                                >(
                                                  PCRData,
                                                  setPCRData,
                                                  sectionIdentifier,
                                                  'description',
                                                  errors,
                                                  crtAgency,
                                                  undefined,
                                                  index,
                                                  'project_element',
                                                  index_cause_of_delay,
                                                  'cause_of_delay',
                                                )}

                                                <IoTrash
                                                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                                                  size={16}
                                                  onClick={() => {
                                                    onRemoveCauseOfDelay(
                                                      index_cause_of_delay,
                                                      index,
                                                      crtAgency,
                                                    )
                                                  }}
                                                />
                                              </div>
                                              {index !==
                                                causeOfDelayData.length - 1 && (
                                                <Divider className="my-5" />
                                              )}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    <SubmitButton
                                      title="Add cause of delay"
                                      onSubmit={() =>
                                        onAddCauseOfDelay(crtAgency, index)
                                      }
                                      className="mr-auto h-8"
                                    />
                                  </span>
                                </div>
                                {index !== projectElementData.length - 1 && (
                                  <Divider className="my-5" />
                                )}
                              </span>
                            )
                          })}
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
