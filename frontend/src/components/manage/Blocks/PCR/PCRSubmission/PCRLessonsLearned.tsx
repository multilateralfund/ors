import { useContext, useState } from 'react'

import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import {
  EditSectionIndicator,
  AddEntityButton,
  DeleteEntityButton,
} from './EditHelperComponents'
import {
  SubSectionTitle,
  UserInfo,
  NoDataReported,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'
import { pcField, llField, borderedContainerClassname } from '../constants'

import { filter, find, map, omit, sumBy } from 'lodash'
import cx from 'classnames'
import {
  Tabs,
  Tab,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'

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
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { lessons_learned: lessonsLearnedErrors } = errors
  const pcErrors = lessonsLearnedErrors[pcField]

  const agencyErrors = map(pcErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors(
    { [pcField]: agencyErrors },
    llField,
  )
  const learnedLessonsErrors = map(agencyErrors, (error) => map(error, llField))

  const DataHeader = (
    <SubSectionTitle className="mb-5 flex-1">Lessons learned</SubSectionTitle>
  )

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

  const onAddLessonLearned = (pcIndex: number, llId: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialLessonLearned = { lesson_id: llId, description: '' }

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

  const onRemoveLessonLearned = (llId: number, pcIndex: number) => {
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
                          (ll) => ll.lesson_id !== llId,
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
            (ll) => ll.lesson_id !== llId,
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
      <div className="flex gap-2">
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
              label={
                <TabLabel field={pcField} errors={pcErrors} {...{ agency }} />
              }
            />
          ))}
        </Tabs>
        <EditSectionIndicator />
      </div>
      <div className="border-0 border-t border-solid border-primary pt-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="mb-2 flex flex-col gap-y-6">
          {map(pcData, (pc, pcIndex) => {
            const llData = pc[llField] || []

            return (
              <div key={pcIndex} className="flex">
                <div className="w-1/4 bg-primary px-6 py-4">
                  <span className="text-lg uppercase text-mlfs-hlYellow">
                    Project component
                  </span>
                  <PCRSelectWidget
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="project_component_option_id"
                    options={projectComponentOptions}
                    errors={agencyErrors}
                    indexes={[crtTab, pcIndex]}
                    subFields={['', pcField]}
                    excludeLabel={true}
                  />
                  <Divider className="my-4 opacity-20" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg uppercase text-mlfs-hlYellow">
                      Lessons learned
                    </span>
                    <UserInfo
                      info="Select from the list the lesson(s) learned that correspond to the selected project element(s)."
                      className={{
                        containerClassname:
                          '!mt-0 !h-6 !w-6 !border-mlfs-hlYellow !bg-primary',
                        labelClassname: 'text-mlfs-hlYellow',
                      }}
                    />
                  </div>
                  <FormGroup className="mt-2">
                    {lessonLearnedOptions.map((option) => (
                      <FormControlLabel
                        key={option.name}
                        label={option.name}
                        control={
                          <Checkbox
                            size="small"
                            checked={llData.some(
                              (ll) =>
                                Number(ll.lesson_id) === Number(option.id),
                            )}
                            onChange={(event) => {
                              if (event.target.checked) {
                                onAddLessonLearned(pcIndex, Number(option.id))
                              } else {
                                onRemoveLessonLearned(
                                  Number(option.id),
                                  pcIndex,
                                )
                              }
                            }}
                            sx={{
                              p: 0,
                              color: '#9aafb9',
                              '&.Mui-checked .MuiSvgIcon-root': {
                                color: 'var(--color-mlfs-hlYellow)',
                              },
                            }}
                          />
                        }
                        sx={{
                          gap: '6px',
                          margin: 0,
                          marginBottom: '12px',
                          alignItems: 'flex-start',
                          color: '#e2eaf0',
                        }}
                      />
                    ))}
                  </FormGroup>
                </div>
                <div
                  className={cx(
                    'w-3/4 bg-white px-6 py-4',
                    borderedContainerClassname,
                  )}
                >
                  {llData.length > 0 ? (
                    <>
                      <div className="flex">
                        {DataHeader}
                        <DeleteEntityButton
                          title="Remove project component"
                          onAction={() => {
                            onRemoveProjectComponent(pcIndex)
                          }}
                        />
                      </div>
                      {map(llData, (ll, llIndex) => {
                        const crtLlName =
                          find(
                            lessonLearnedOptions,
                            (llOpt) => llOpt.id === ll.lesson_id,
                          )?.name ?? '-'

                        return (
                          <div key={llIndex}>
                            <div className="flex gap-3">
                              <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-mlfs-hlYellow">
                                {llIndex + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="m-0 mb-3 text-lg font-semibold text-primary">
                                  {crtLlName}
                                </h4>
                                <PCRTextAreaWidget
                                  {...{
                                    PCRData,
                                    setPCRData,
                                    sectionIdentifier,
                                  }}
                                  field="description"
                                  errors={learnedLessonsErrors}
                                  indexes={[crtTab, pcIndex, llIndex]}
                                  subFields={['', pcField, llField]}
                                  rows={2}
                                />
                              </div>
                            </div>
                            {llIndex !== llData.length - 1 && (
                              <Divider className="-mx-6 my-4" />
                            )}
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <>
                      {DataHeader}
                      <NoDataReported text="No data reported." />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <AddEntityButton
          title="Add project component"
          action={onAddProjectComponent}
          nrEntities={pcData.length}
        />
      </div>
    </>
  )
}

export default PCRLessonsLearned
