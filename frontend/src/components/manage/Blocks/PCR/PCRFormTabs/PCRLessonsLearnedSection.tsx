import {
  PCRData,
  PCROverviewSectionProps,
  PCRLessonsLearned,
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
  initialLessonsLearned,
  initialProjectElementLessonsLearned,
  projectElementOpts,
} from '../constants'

const PCRLessonsLearnedSection = ({
  PCRData,
  setPCRData,
  errors,
  setCurrentTab,
}: PCROverviewSectionProps & { errors: { [key: string]: string[] } }) => {
  const sectionIdentifier = 'lessons_learned'
  const projectElementField = 'project_element'
  const lessonLearnedField = 'lesson_learned'

  const lessonsLearnedData = PCRData[sectionIdentifier] || []

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
                  initialProjectElementLessonsLearned,
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

  const onAddLessonLearned = (index: number, index2: number) => {
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
                          [lessonLearnedField]: [
                            ...proj_elem[lessonLearnedField],
                            initialLessonsLearned,
                          ],
                        }
                      : proj_elem,
                ),
              }
            : agency,
        ),
      }
    }, lessonLearnedField)
  }

  const onRemoveLessonLearned = (
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
                          [lessonLearnedField]: projElem[
                            lessonLearnedField
                          ].filter((_, index5) => index5 !== index),
                        }
                      : projElem,
                ),
              }
            : agency,
        ),
      }
    }, lessonLearnedField)
  }

  const { agencies } = useContext(ProjectsDataContext)

  console.log(lessonsLearnedData)
  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    lessonsLearnedData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <>
          <div>
            <Tabs
              aria-label="lessons-learned-tabs"
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
                    lessonsLearnedData[crtAgency][projectElementField] || []

                  console.log({ projectElementData })
                  return (
                    <span key={crtAgency}>
                      <div className="flex flex-col gap-y-2">
                        <div className="flex flex-col flex-wrap gap-x-20">
                          {map(projectElementData, (_, index) => {
                            const lessonLearnedData =
                              lessonsLearnedData[crtAgency][
                                projectElementField
                              ][index][lessonLearnedField] || []

                            return (
                              <span key={index}>
                                <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                                  {widgets['drop_down']<
                                    PCRData,
                                    PCRLessonsLearned
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
                                          lessonLearnedData,
                                          (_, index_lesson_learned) => (
                                            <span key={index_lesson_learned}>
                                              <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
                                                {widgets['drop_down']<
                                                  PCRData,
                                                  PCRLessonsLearned
                                                >(
                                                  PCRData,
                                                  setPCRData,
                                                  sectionIdentifier,
                                                  'lesson_learned_id',
                                                  causeOfDelayOpts,
                                                  errors,
                                                  crtAgency,
                                                  undefined,
                                                  index,
                                                  'project_element',
                                                  index_lesson_learned,
                                                  'lesson_learned',
                                                )}
                                                {widgets['text_area']<
                                                  PCRData,
                                                  PCRLessonsLearned
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
                                                  index_lesson_learned,
                                                  'lesson_learned',
                                                )}

                                                <IoTrash
                                                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                                                  size={16}
                                                  onClick={() => {
                                                    onRemoveLessonLearned(
                                                      index_lesson_learned,
                                                      index,
                                                      crtAgency,
                                                    )
                                                  }}
                                                />
                                              </div>
                                              {index !==
                                                lessonLearnedData.length -
                                                  1 && (
                                                <Divider className="my-5" />
                                              )}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    <SubmitButton
                                      title="Add lesson learned"
                                      onSubmit={() =>
                                        onAddLessonLearned(crtAgency, index)
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

export default PCRLessonsLearnedSection
