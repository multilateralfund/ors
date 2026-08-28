import { Fragment, useContext, useState } from 'react'

import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'
import { pcField, cdField } from '../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, map, omit } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import cx from 'classnames'

const PCRCausesOfDelay = () => {
  const sectionIdentifier = 'causes_of_delay'

  const { agencies } = useContext(ProjectsDataContext)
  const {
    PCRData,
    setPCRData,
    projectComponentOptions,
    causeOfDelayOptions,
    errors,
    setErrors,
  } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const pcData = sectionData[crtTab][pcField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { causes_of_delay: causesOfDelayErrors } = errors
  const pcErrors = causesOfDelayErrors[pcField]

  const agencyErrors = map(pcErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors(
    { [pcField]: agencyErrors },
    cdField,
  )
  const delayCausesErrors = map(agencyErrors, (error) => map(error, cdField))

  const onAddProjectComponent = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialProjectComponentData = {
        project_component_option_id: null,
        [cdField]: [],
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
      const errorIndex = getErrorIndex(
        sectionData,
        pcField,
        crtAgencyId,
        pcIndex,
      )

      return {
        ...prevData,
        [pcField]: filter(
          prevData[pcField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  const onAddCauseOfDelay = (pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialCauseOfDelay = { delay_id: null, description: '' }

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
                        [cdField]: [...pc[cdField], initialCauseOfDelay],
                      }
                    : pc,
                ),
              }
            : data,
        ),
      }
    }, cdField)
  }

  const onRemoveCauseOfDelay = (cdIndex: number, pcIndex: number) => {
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
                        [cdField]: pc[cdField].filter(
                          (_, crtCdIndex) => crtCdIndex !== cdIndex,
                        ),
                      }
                    : pc,
                ),
              }
            : data,
        ),
      }
    }, cdField)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        pcField,
        crtAgencyId,
        pcIndex,
      )

      return {
        ...prevData,
        [pcField]: map(prevData[pcField], (component, index) => {
          if (index !== errorIndex) {
            return component
          }

          const updatedCausesOfDelay = filter(
            component[cdField],
            (_, delayIndex: number) => delayIndex !== cdIndex,
          )

          return updatedCausesOfDelay.length
            ? { ...component, [cdField]: updatedCausesOfDelay }
            : omit(component, [cdField])
        }),
      }
    })
  }

  return (
    <>
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
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="flex flex-col gap-y-4">
          {map(pcData, (_, pcIndex) => {
            const cdData = pcData[pcIndex][cdField] || []

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
                  {cdData.length > 0 && <Divider className="my-5" />}
                  <div className="flex flex-col gap-y-4">
                    {map(cdData, (_, cdIndex) => (
                      <Fragment key={cdIndex}>
                        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                          <PCRSelectWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="delay_id"
                            options={causeOfDelayOptions}
                            errors={delayCausesErrors}
                            indexes={[crtTab, pcIndex, cdIndex]}
                            subFields={['', pcField, cdField]}
                          />
                          <PCRTextAreaWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="description"
                            errors={delayCausesErrors}
                            indexes={[crtTab, pcIndex, cdIndex]}
                            subFields={['', pcField, cdField]}
                          />
                          <IoTrash
                            className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                            size={16}
                            onClick={() => {
                              onRemoveCauseOfDelay(cdIndex, pcIndex)
                            }}
                          />
                        </div>
                        {cdIndex !== cdData.length - 1 && (
                          <Divider className="my-5" />
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <SubmitButton
                    title="Add cause of delay"
                    onSubmit={() => onAddCauseOfDelay(pcIndex)}
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

export default PCRCausesOfDelay
