import { Fragment, useContext, useState } from 'react'

import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { PCRCausesOfDelayData } from '../interfaces'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { find, map } from 'lodash'
import cx from 'classnames'

const PCRCausesOfDelay = () => {
  const sectionIdentifier = 'causes_of_delay'
  const pcField = 'pcr_project_component'
  const cdField = 'delay'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, projectComponentOptions, causeOfDelayOptions } =
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
        delay: [],
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

  const onAddCauseOfDelay = (agencyIndex: number, pcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialCauseOfDelay = { cause_of_delay_id: null, description: '' }

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

  const onRemoveCauseOfDelay = (
    cdIndex: number,
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
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-col gap-y-4">
          {map(pcData, (_, pcIndex) => {
            const cdData = pcData[pcIndex][cdField] || []

            return (
              <div key={pcIndex} className="flex items-center gap-2">
                <div className="relative flex flex-1 flex-col gap-y-4 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
                  <PCRSelectWidget<PCRCausesOfDelayData>
                    {...{ PCRData, setPCRData, sectionIdentifier }}
                    field="pcr_project_component_id"
                    options={projectComponentOptions}
                    errors={{}}
                    indexes={[crtTab, pcIndex]}
                    subFields={['', 'pcr_project_component']}
                  />
                  {cdData.length > 0 && <Divider className="my-5" />}
                  <div className="flex flex-col gap-y-4">
                    {map(cdData, (_, cdIndex) => (
                      <Fragment key={cdIndex}>
                        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                          <PCRSelectWidget<PCRCausesOfDelayData>
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="cause_of_delay_id"
                            options={causeOfDelayOptions}
                            errors={{}}
                            indexes={[crtTab, pcIndex, cdIndex]}
                            subFields={['', 'pcr_project_component', 'delay']}
                          />
                          <PCRTextAreaWidget<PCRCausesOfDelayData>
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="description"
                            errors={{}}
                            indexes={[crtTab, pcIndex, cdIndex]}
                            subFields={['', 'pcr_project_component', 'delay']}
                          />
                          <IoTrash
                            className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                            size={16}
                            onClick={() => {
                              onRemoveCauseOfDelay(cdIndex, pcIndex, crtTab)
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
                    onSubmit={() => onAddCauseOfDelay(crtTab, pcIndex)}
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

export default PCRCausesOfDelay
