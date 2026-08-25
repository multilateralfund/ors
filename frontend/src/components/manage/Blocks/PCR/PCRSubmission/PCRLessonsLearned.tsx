import { Fragment, useContext, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { formatErrors, getErrorIndex, hasSectionErrors } from '../utils'
import { pcField, llField } from '../constants'
import { ApiAgency } from '@ors/types/api_agencies'

import { filter, find, map, omit, sumBy } from 'lodash'
import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import cx from 'classnames'

const PCRLessonsLearned = () => {
  const sectionIdentifier = 'lessons_learned'

  const { agencies } = useContext(ProjectsDataContext)
  const {
    PCRData,
    setPCRData,
    projectComponentOptions,
    lessonLearnedOptions,
    errors,
    setErrors,
  } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const pcData = sectionData[crtTab][pcField] || []
  const crtAgencyId = sectionData[crtTab].agency_id

  const { lessons_learned: lessonsLearnedErrors } = errors
  const pcErrors = lessonsLearnedErrors[pcField]

  const agencyErrors = map(pcErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors(
    { [pcField]: agencyErrors },
    llField,
  )
  const learnedLessonsErrors = map(agencyErrors, (error) => map(error, llField))

  const crtAgencies =
    agencies && agencies.length > 0
      ? map(
          sectionData,
          (entry) => find(agencies, (agency) => agency.id === entry.agency_id)!,
        )
      : []

  const TabLabel = ({ agency }: { agency: ApiAgency }) => {
    const tabErrors = { [pcField]: map(pcErrors[agency.id], 'errors') }

    return (
      <div className="relative flex items-center justify-between gap-x-2">
        <div className="leading-tight">{agency.name}</div>
        {hasSectionErrors(tabErrors) && <SectionErrorIndicator errors={[]} />}
      </div>
    )
  }

  const onAddProjectComponent = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialProjectComponentData = {
        project_component_option_id: null,
        [llField]: [],
      }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [pcField]: [...data[pcField], initialProjectComponentData],
              }
            : data,
        ),
      }
    }, pcField)
  }

  const onRemoveProjectComponent = (pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [pcField]: data[pcField].filter(
                  (_, crtPcIndex) => crtPcIndex !== pcIndex,
                ),
              }
            : data,
        ),
      }
    }, pcField)

    setErrors((prevData: Record<string, any[]>) => {
      const sectionErrorIndex = getErrorIndex(
        sectionData,
        pcField,
        crtAgencyId,
        pcIndex,
      )

      const causesOfDelayErrors = map(PCRData.causes_of_delay, (data) => ({
        [data.agency_id]: data[pcField].length,
      }))
      const causesOfDelayErrorsLength = sumBy(
        causesOfDelayErrors,
        (entry) => Object.values(entry)[0],
      )

      const errorIndex = sectionErrorIndex + causesOfDelayErrorsLength

      return {
        ...prevData,
        [pcField]: filter(
          prevData[pcField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  const onAddLessonLearned = (pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialLessonLearned = { lesson_id: null, description: '' }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [pcField]: data[pcField].map((pc, crtPcIndex) =>
                  crtPcIndex === pcIndex
                    ? {
                        ...pc,
                        [llField]: [...pc[llField], initialLessonLearned],
                      }
                    : pc,
                ),
              }
            : data,
        ),
      }
    }, llField)
  }

  const onRemoveLessonLearned = (llIndex: number, pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [pcField]: map(data[pcField], (pc, crtPcIndex) =>
                  crtPcIndex === pcIndex
                    ? {
                        ...pc,
                        [llField]: pc[llField].filter(
                          (_, crtLlIndex) => crtLlIndex !== llIndex,
                        ),
                      }
                    : pc,
                ),
              }
            : data,
        ),
      }
    }, llField)

    setErrors((prevData: Record<string, any[]>) => {
      const sectionErrorIndex = getErrorIndex(
        sectionData,
        pcField,
        crtAgencyId,
        pcIndex,
      )

      const causesOfDelayErrors = map(PCRData.causes_of_delay, (data) => ({
        [data.agency_id]: data[pcField].length,
      }))
      const causesOfDelayErrorsLength = sumBy(
        causesOfDelayErrors,
        (entry) => Object.values(entry)[0],
      )

      const errorIndex = sectionErrorIndex + causesOfDelayErrorsLength

      return {
        ...prevData,
        [pcField]: map(prevData[pcField], (component, index) => {
          if (index !== errorIndex) {
            return component
          }

          const updatedLessonsLearned = filter(
            component[llField],
            (_, lessonIndex: number) => lessonIndex !== llIndex,
          )

          return updatedLessonsLearned.length
            ? { ...component, [llField]: updatedLessonsLearned }
            : omit(component, [llField])
        }),
      }
    })
  }

  return (
    <>
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
            label={<TabLabel {...{ agency }} />}
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="flex flex-col gap-y-4">
          {map(pcData, (_, pcIndex) => {
            const llData = pcData[pcIndex][llField] || []

            return (
              <div key={pcIndex} className="flex items-center gap-2">
                <div className="relative flex flex-1 flex-col gap-y-4 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
                  <PCRSelectWidget
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="project_component_option_id"
                    options={projectComponentOptions}
                    errors={agencyErrors}
                    indexes={[crtTab, pcIndex]}
                    subFields={['', pcField]}
                  />
                  {llData.length > 0 && <Divider className="my-5" />}
                  <div className="flex flex-col gap-y-4">
                    {map(llData, (_, llIndex) => (
                      <Fragment key={llIndex}>
                        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                          <PCRSelectWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="lesson_id"
                            options={lessonLearnedOptions}
                            errors={learnedLessonsErrors}
                            indexes={[crtTab, pcIndex, llIndex]}
                            subFields={['', pcField, llField]}
                          />
                          <PCRTextAreaWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="description"
                            errors={learnedLessonsErrors}
                            indexes={[crtTab, pcIndex, llIndex]}
                            subFields={['', pcField, llField]}
                          />
                          <IoTrash
                            className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                            size={16}
                            onClick={() => {
                              onRemoveLessonLearned(llIndex, pcIndex)
                            }}
                          />
                        </div>
                        {llIndex !== llData.length - 1 && (
                          <Divider className="my-5" />
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <SubmitButton
                    title="Add lesson learned"
                    onSubmit={() => onAddLessonLearned(pcIndex)}
                    className="mr-auto mt-5 h-8"
                  />
                </div>
                <IoTrash
                  className="min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveProjectComponent(pcIndex)
                  }}
                />
              </div>
            )
          })}
        </div>
        <SubmitButton
          title="Add project component"
          onSubmit={onAddProjectComponent}
          className={cx('mr-auto h-8', { 'mt-4': pcData.length > 0 })}
        />
      </div>
    </>
  )
}

export default PCRLessonsLearned
