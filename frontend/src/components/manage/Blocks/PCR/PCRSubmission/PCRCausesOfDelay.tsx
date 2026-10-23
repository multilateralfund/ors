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
import { pcField, cdField, borderedContainerClassname } from '../constants'

import { filter, find, map, omit } from 'lodash'
import cx from 'classnames'
import {
  Tabs,
  Tab,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'

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

  const DataHeader = (
    <div className="mb-5 grid flex-1 grid-cols-2 gap-4">
      <SubSectionTitle>Description of the root causes of delay</SubSectionTitle>
      <SubSectionTitle>Action taken</SubSectionTitle>
    </div>
  )

  const onAddDelayCluster = () => {
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

  const onRemoveDelayCluster = (pcIndex: number) => {
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

  const onAddCauseOfDelay = (pcIndex: number, cdId: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialCauseOfDelay = {
        delay_id: cdId,
        description: '',
        action_taken: '',
      }

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

  const onRemoveCauseOfDelay = (cdId: number, pcIndex: number) => {
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
                          (cd) => cd.delay_id !== cdId,
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
            (delay) => delay.delay_id !== cdId,
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
      <div className="flex gap-2">
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
        <EditSectionIndicator />
      </div>
      <div className="border-0 border-t border-solid border-primary pt-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="mb-2 flex flex-col gap-y-6">
          {map(pcData, (pc, pcIndex) => {
            const cdData = pc[cdField] || []

            return (
              <div key={pcIndex} className="flex">
                <div className="w-1/4 bg-primary px-6 py-4">
                  <span className="text-lg uppercase text-mlfs-hlYellow">
                    Delay clusters
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
                      Root causes of delay
                    </span>
                    <UserInfo
                      info="Select from the list of the root cause(s) of delay that correspond to the selected delay cluster."
                      className={{
                        containerClassname:
                          '!mt-0 !h-6 !w-6 !border-mlfs-hlYellow !bg-primary',
                        labelClassname: 'text-mlfs-hlYellow',
                      }}
                    />
                  </div>
                  <FormGroup className="mt-2">
                    {causeOfDelayOptions.map((option) => (
                      <FormControlLabel
                        key={option.name}
                        label={option.name}
                        control={
                          <Checkbox
                            size="small"
                            checked={cdData.some(
                              (cd) => Number(cd.delay_id) === Number(option.id),
                            )}
                            onChange={(event) => {
                              if (event.target.checked) {
                                onAddCauseOfDelay(pcIndex, Number(option.id))
                              } else {
                                onRemoveCauseOfDelay(Number(option.id), pcIndex)
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
                  {cdData.length > 0 ? (
                    <>
                      <div className="relative">
                        {DataHeader}
                        <div className="absolute right-0 top-0">
                          <DeleteEntityButton
                            title="Remove delay cluster"
                            onAction={() => {
                              onRemoveDelayCluster(pcIndex)
                            }}
                          />
                        </div>
                      </div>
                      {map(cdData, (cd, cdIndex) => {
                        const crtCdName =
                          find(
                            causeOfDelayOptions,
                            (cdOpt) => cdOpt.id === cd.delay_id,
                          )?.name ?? '-'

                        return (
                          <div key={cdIndex}>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex gap-3">
                                <div className="flex h-6 min-h-6 w-6 min-w-6 items-center justify-center rounded-full bg-primary text-lg font-medium text-mlfs-hlYellow">
                                  {cdIndex + 1}
                                </div>
                                <h4 className="m-0 text-lg font-semibold text-primary">
                                  {crtCdName}
                                </h4>
                              </div>
                              <div />
                              <PCRTextAreaWidget
                                {...{ PCRData, setPCRData, sectionIdentifier }}
                                field="description"
                                errors={delayCausesErrors}
                                indexes={[crtTab, pcIndex, cdIndex]}
                                subFields={['', pcField, cdField]}
                                rows={2}
                                className="md:!min-w-full"
                              />
                              <PCRTextAreaWidget
                                {...{ PCRData, setPCRData, sectionIdentifier }}
                                field="action_taken"
                                errors={delayCausesErrors}
                                indexes={[crtTab, pcIndex, cdIndex]}
                                subFields={['', pcField, cdField]}
                                rows={2}
                                excludeLabel={true}
                                className="mt-[37px] md:!min-w-full"
                              />
                            </div>
                            {cdIndex !== cdData.length - 1 && (
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
          title="Add delay cluster"
          action={onAddDelayCluster}
          nrEntities={pcData.length}
        />
      </div>
    </>
  )
}

export default PCRCausesOfDelay
