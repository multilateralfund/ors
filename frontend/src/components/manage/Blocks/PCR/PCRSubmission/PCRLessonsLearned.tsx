import { Fragment, useContext, useState } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { find, map } from 'lodash'
import cx from 'classnames'

const PCRLessonsLearned = () => {
  const sectionIdentifier = 'lessons_learned'
  const pcField = 'pcr_project_component'
  const llField = 'lesson'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, projectComponentOptions, lessonLearnedOptions } =
    useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const pcData = sectionData[crtTab][pcField] || []

  const crtAgencies = map(
    sectionData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  const onAddProjectComponent = (agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialProjectComponentData = {
        pcr_project_component_id: null,
        lesson: [],
      }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
            ? {
                ...data,
                [pcField]: [...data[pcField], initialProjectComponentData],
              }
            : data,
        ),
      }
    }, pcField)
  }

  const onRemoveProjectComponent = (pcIndex: number, agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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
  }

  const onAddLessonLearned = (agencyIndex: number, pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialLessonLearned = { lesson_learned_id: null, description: '' }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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

  const onRemoveLessonLearned = (
    llIndex: number,
    pcIndex: number,
    agencyIndex: number,
  ) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-col gap-y-4">
          {map(pcData, (_, pcIndex) => {
            const llData = pcData[pcIndex][llField] || []

            return (
              <div key={pcIndex} className="flex items-center gap-2">
                <div className="relative flex flex-1 flex-col gap-y-4 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
                  <PCRSelectWidget
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="pcr_project_component_id"
                    options={projectComponentOptions}
                    errors={{}}
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
                            field="lesson_learned_id"
                            options={lessonLearnedOptions}
                            errors={{}}
                            indexes={[crtTab, pcIndex, llIndex]}
                            subFields={['', pcField, llField]}
                          />
                          <PCRTextAreaWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="description"
                            errors={{}}
                            indexes={[crtTab, pcIndex, llIndex]}
                            subFields={['', pcField, llField]}
                          />
                          <IoTrash
                            className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                            size={16}
                            onClick={() => {
                              onRemoveLessonLearned(llIndex, pcIndex, crtTab)
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
                    onSubmit={() => onAddLessonLearned(crtTab, pcIndex)}
                    className="mr-auto mt-5 h-8"
                  />
                </div>
                <IoTrash
                  className="min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveProjectComponent(pcIndex, crtTab)
                  }}
                />
              </div>
            )
          })}
        </div>
        <SubmitButton
          title="Add project component"
          onSubmit={() => onAddProjectComponent(crtTab)}
          className={cx('mr-auto h-8', { 'mt-4': pcData.length > 0 })}
        />
      </div>
    </>
  )
}

export default PCRLessonsLearned
