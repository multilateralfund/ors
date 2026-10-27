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
import {
  delayField,
  cdField,
  dcField,
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
  } = useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[delayField] || []
  const dcData = sectionData[crtTab][cdField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { delay_causes: delayCausesErrors } = errors
  const dcErrors = delayCausesErrors[cdField]

  const agencyErrors = map(dcErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors(
    { [cdField]: agencyErrors },
    dcField,
  )
  const causesOfDelayErrors = map(agencyErrors, (error) => map(error, dcField))

  const DataHeader = (
    <div className="mb-5 grid flex-1 grid-cols-2 gap-4">
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
        [cdField]: filter(
          prevData[cdField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  const onAddCauseOfDelay = (dcIndex: number, cdId: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[delayField] || []
      const initialCauseOfDelay = {
        root_cause_id: cdId,
        description_roots_causes_of_delay: '',
        action_taken: '',
      }

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
        [cdField]: map(prevData[cdField], (component, index) => {
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
                <TabLabel field={cdField} errors={dcErrors} {...{ agency }} />
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
          {map(dcData, (pc, pcIndex) => {
            const cdData = pc[dcField] || []

            return (
              <div key={pcIndex} className="flex">
                <div className="w-1/4 bg-primary px-6 py-4">
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
                            rootCauseOfDelayOptions,
                            (cdOpt) => cdOpt.id === cd.root_cause_id,
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
                                {...{ PCRData, setPCRData }}
                                sectionIdentifier={delayField}
                                field="description_roots_causes_of_delay"
                                errors={causesOfDelayErrors}
                                indexes={[crtTab, pcIndex, cdIndex]}
                                subFields={['', cdField, dcField]}
                                rows={2}
                                className="md:!min-w-full"
                              />
                              <PCRTextAreaWidget
                                {...{ PCRData, setPCRData }}
                                sectionIdentifier={delayField}
                                field="action_taken"
                                errors={causesOfDelayErrors}
                                indexes={[crtTab, pcIndex, cdIndex]}
                                subFields={['', cdField, dcField]}
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
          nrEntities={dcData.length}
        />
      </div>
    </>
  )
}

export default PCRCausesOfDelay
