import { useContext, useState } from 'react'

import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  ErrorsList,
  FieldErrorIndicator,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { AddEntityButton, DeleteEntityButton } from './EditHelperComponents'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import {
  SubSectionTitle,
  UserInfo,
  NrEntity,
  NoDataReported,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'
import {
  delayField,
  cdField,
  dcField,
  agencyErrorsField,
  borderedContainerClassname,
} from '../constants'

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
  const { agencies } = useContext(ProjectsDataContext)
  const {
    PCRData,
    setPCRData,
    delayClusterOptions,
    rootCauseOfDelayOptions,
    errors,
    setErrors,
    stashRemovedEntry,
    takeRemovedEntry,
  } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[delayField] || []
  const dcData = sectionData[crtTab][cdField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { delay_causes: delayCausesErrors } = errors
  const dcErrors = delayCausesErrors[cdField]

  const agencyLevelErrors = delayCausesErrors[agencyErrorsField] ?? {}
  const crtAgencyLevelErrors = Object.assign(
    {},
    ...map(agencyLevelErrors[crtAgencyId], 'errors'),
  )

  const getTabErrors = (agencyId: number) => ({
    [agencyId]: [
      ...(dcErrors[agencyId] ?? []),
      ...(agencyLevelErrors[agencyId] ?? []),
    ],
  })

  const agencyErrors = map(dcErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = [
    ...formatErrors(crtAgencyLevelErrors),
    ...formatErrors({ [cdField]: agencyErrors }, dcField),
  ]
  const causesOfDelayErrors = [map(agencyErrors, dcField)]

  const DataHeader = (
    <div className="mb-5 hidden flex-1 grid-cols-2 items-start gap-4 md:grid">
      <SubSectionTitle>Description of the root causes of delay</SubSectionTitle>
      <SubSectionTitle>Action taken</SubSectionTitle>
    </div>
  )

  const onAddDelayCluster = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[delayField] || []
      const initialDelayClusterData = {
        delay_cluster_id: null,
        [dcField]: [],
      }

      return {
        ...prevData,
        [delayField]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [cdField]: [...(data[cdField] || []), initialDelayClusterData],
              }
            : data,
        ),
      }
    }, cdField)

    const errorIndex = getErrorIndex(
      sectionData,
      cdField,
      crtAgencyId,
      dcData.length,
    )

    setErrors((prevData: Record<string, any[]>) => {
      const delayCausesErrors = prevData[delayField] ?? []

      return {
        ...prevData,
        [delayField]: [
          ...delayCausesErrors.slice(0, errorIndex),
          {},
          ...delayCausesErrors.slice(errorIndex),
        ],
      }
    })
  }

  const onRemoveDelayCluster = (dcIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[delayField] || []

      return {
        ...prevData,
        [delayField]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [cdField]: filter(
                  data[cdField],
                  (_, crtDcIndex) => crtDcIndex !== dcIndex,
                ),
              }
            : data,
        ),
      }
    }, cdField)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        cdField,
        crtAgencyId,
        dcIndex,
      )

      return {
        ...prevData,
        [delayField]: filter(
          prevData[delayField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  const getCauseOfDelayKey = (dcIndex: number, cdId: number) =>
    `delay:${crtAgencyId}:${dcData[dcIndex]?.delay_cluster_id}:${cdId}`

  const onAddCauseOfDelay = (dcIndex: number, cdId: number) => {
    const initialCauseOfDelay = takeRemovedEntry(
      getCauseOfDelayKey(dcIndex, cdId),
    ) ?? {
      root_cause_id: cdId,
      description_roots_causes_of_delay: '',
      action_taken: '',
    }

    setPCRData((prevData) => {
      const sectionData = prevData[delayField] || []

      return {
        ...prevData,
        [delayField]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [cdField]: data[cdField].map((cd, crtCdIndex) =>
                  crtCdIndex === dcIndex
                    ? {
                        ...cd,
                        [dcField]: [
                          ...(cd[dcField] || []),
                          initialCauseOfDelay,
                        ],
                      }
                    : cd,
                ),
              }
            : data,
        ),
      }
    }, dcField)
  }

  const onRemoveCauseOfDelay = (cdId: number, dcIndex: number) => {
    stashRemovedEntry(
      getCauseOfDelayKey(dcIndex, cdId),
      find(
        dcData[dcIndex]?.[dcField],
        (cd) => Number(cd.root_cause_id) === cdId,
      ),
    )

    setPCRData((prevData) => {
      const sectionData = prevData[delayField] || []

      return {
        ...prevData,
        [delayField]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [cdField]: map(data[cdField], (dc, crtDcIndex) =>
                  crtDcIndex === dcIndex
                    ? {
                        ...dc,
                        [dcField]: filter(
                          dc[dcField],
                          (cd) => cd.root_cause_id !== cdId,
                        ),
                      }
                    : dc,
                ),
              }
            : data,
        ),
      }
    }, dcField)

    const cdIndex = (
      sectionData[crtTab]?.[cdField]?.[dcIndex]?.[dcField] || []
    ).findIndex((cd) => cd.root_cause_id === cdId)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        cdField,
        crtAgencyId,
        dcIndex,
      )

      return {
        ...prevData,
        [delayField]: map(prevData[delayField], (component, index) => {
          if (index !== errorIndex) {
            return component
          }

          const updatedCausesOfDelay = filter(
            component[dcField] as any[],
            (_, crtCdIndex) => crtCdIndex !== cdIndex,
          )

          return updatedCausesOfDelay.length
            ? { ...component, [dcField]: updatedCausesOfDelay }
            : omit(component, [dcField])
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
              <TabLabel
                field={cdField}
                errors={getTabErrors(agency.id)}
                {...{ agency }}
              />
            }
          />
        ))}
      </Tabs>
      <div className="border-0 border-t border-solid border-primary pt-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="mb-2 flex flex-col gap-y-6">
          {map(dcData, (pc, pcIndex) => {
            const cdData = pc[dcField] || []

            return (
              <div key={pcIndex} className="flex flex-col lg:flex-row">
                <div className="w-full bg-primary px-6 py-4 lg:w-1/4">
                  <span className="text-lg uppercase text-mlfs-hlYellow">
                    Delay clusters
                  </span>
                  <PCRSelectWidget
                    {...{ PCRData, setPCRData }}
                    sectionIdentifier={delayField}
                    field="delay_cluster_id"
                    options={delayClusterOptions}
                    errors={agencyErrors}
                    indexes={[crtTab, pcIndex]}
                    subFields={['', cdField]}
                    excludeLabel={true}
                  />
                  <Divider className="my-4 opacity-20" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg uppercase text-mlfs-hlYellow">
                      Root causes of delay
                    </span>
                    {cdData.length === 0 && (
                      <FieldErrorIndicator
                        errors={agencyErrors[pcIndex]}
                        field={dcField}
                      />
                    )}
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
                    {map(rootCauseOfDelayOptions, (option) => (
                      <FormControlLabel
                        key={option.name}
                        label={option.name}
                        control={
                          <Checkbox
                            size="small"
                            checked={cdData.some(
                              (cd) =>
                                Number(cd.root_cause_id) === Number(option.id),
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
                    'w-full bg-white px-6 py-4 lg:w-3/4 [&_textarea]:!min-w-0',
                    borderedContainerClassname,
                  )}
                >
                  <div className="relative">
                    {DataHeader}
                    <div className="mb-4 flex justify-end md:absolute md:right-0 md:top-0 md:mb-0">
                      <DeleteEntityButton
                        title="Remove delay cluster"
                        onAction={() => {
                          onRemoveDelayCluster(pcIndex)
                        }}
                      />
                    </div>
                  </div>
                  {cdData.length > 0 ? (
                    map(cdData, (cd, cdIndex) => {
                      const crtCdName =
                        find(
                          rootCauseOfDelayOptions,
                          (cdOpt) => cdOpt.id === cd.root_cause_id,
                        )?.name ?? '-'

                      return (
                        <div key={cdIndex}>
                          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-3">
                              {NrEntity(cdIndex)}
                              <h4 className="m-0 text-lg font-semibold text-primary">
                                {crtCdName}
                              </h4>
                              <FieldErrorIndicator
                                errors={
                                  agencyErrors[pcIndex]?.[dcField]?.[cdIndex]
                                }
                                field="root_cause_id"
                              />
                            </div>
                            <div className="hidden md:block" />
                            <PCRTextAreaWidget
                              {...{ PCRData, setPCRData }}
                              sectionIdentifier={delayField}
                              field="description_roots_causes_of_delay"
                              errors={causesOfDelayErrors}
                              indexes={[crtTab, pcIndex, cdIndex]}
                              subFields={['', cdField, dcField]}
                              rows={2}
                              className="md:!min-w-[calc(100%-28px)]"
                            />
                            <div>
                              <Label className="md:invisible">
                                Action taken
                              </Label>
                              <PCRTextAreaWidget
                                {...{ PCRData, setPCRData }}
                                sectionIdentifier={delayField}
                                field="action_taken"
                                errors={causesOfDelayErrors}
                                indexes={[crtTab, pcIndex, cdIndex]}
                                subFields={['', cdField, dcField]}
                                rows={2}
                                excludeLabel={true}
                                className="md:!min-w-[calc(100%-28px)]"
                              />
                            </div>
                          </div>
                          {cdIndex !== cdData.length - 1 && (
                            <Divider className="-mx-6 my-4" />
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <NoDataReported text="No data reported." />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <AddEntityButton
          title="Add delay cluster"
          action={onAddDelayCluster}
          nrEntities={dcData.length}
        />
      </div>
    </>
  )
}

export default PCRCausesOfDelay
