import { Fragment, useContext, useState } from 'react'

import {
  ErrorsList,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { TabLabel, PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import { sdgsContributionField, sdgsField } from '../constants'
import { getSectionAgencies, formatErrors } from '../utils'

import { Tabs, Tab, Divider } from '@mui/material'
import { IoTrash } from 'react-icons/io5'
import { filter, map } from 'lodash'
import cx from 'classnames'

const PCRSdgs = () => {
  const sectionIdentifier = 'sdgs_contribution'

  const { agencies } = useContext(ProjectsDataContext)
  const { PCRData, setPCRData, sdgsOptions, errors, setErrors } =
    useContext(PCRDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const sdgsData = sectionData[crtTab][sdgsField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { sdgs_contribution: sdgsContributionErrors } = errors
  const sdgsErrors = sdgsContributionErrors[sdgsContributionField]

  const agencyErrors = map(sdgsErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({
    [sdgsContributionField]: agencyErrors,
  })

  const onAddSdg = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialSdgsData = { goal_id: null, description: '' }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [sdgsField]: [...data[sdgsField], initialSdgsData],
              }
            : data,
        ),
      }
    }, sdgsField)
  }

  const onRemoveSdg = (sdgIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [sdgsField]: data[sdgsField].filter(
                  (_, crtSdgIndex) => crtSdgIndex !== sdgIndex,
                ),
              }
            : data,
        ),
      }
    }, sdgsField)

    setErrors((prevData: Record<string, any[]>) => {
      const pcrSdgs = PCRData.sdgs_contribution || []
      const filteredSdgs = filter(pcrSdgs, (sdg) => sdg.goals.length > 0)

      const crtAgencyIndex = filteredSdgs.findIndex(
        (entry) => entry.agency_id === crtAgencyId,
      )

      const updatedErrors = map(
        prevData[sdgsContributionField],
        (entry, index) =>
          index === crtAgencyIndex
            ? {
                ...entry,
                goals: filter(
                  entry.goals,
                  (_, goalIndex: number) => goalIndex !== sdgIndex,
                ),
              }
            : entry,
      )

      const crtAgency = pcrSdgs.find((entry) => entry.agency_id === crtAgencyId)

      return {
        ...prevData,
        [sdgsContributionField]:
          crtAgency?.goals?.length === 1
            ? updatedErrors.filter((_, index) => index !== crtAgencyIndex)
            : updatedErrors,
      }
    })
  }

  return (
    <>
      <Tabs
        aria-label="sdgs-tabs"
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
                field={sdgsContributionField}
                errors={sdgsErrors}
                {...{ agency }}
              />
            }
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {formattedAgencyErrors && formattedAgencyErrors.length > 0 && (
          <ErrorsList errors={formattedAgencyErrors} />
        )}
        <div className="flex flex-col gap-y-4">
          {map(sdgsData, (_, sdgIndex) => (
            <Fragment key={sdgIndex}>
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="goal_id"
                  options={sdgsOptions}
                  errors={agencyErrors}
                  indexes={[crtTab, sdgIndex]}
                  subFields={['', sdgsField]}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="description"
                  errors={agencyErrors}
                  indexes={[crtTab, sdgIndex]}
                  subFields={['', sdgsField]}
                />
                <IoTrash
                  className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveSdg(sdgIndex)
                  }}
                />
              </div>
              {sdgIndex !== sdgsData.length - 1 && <Divider className="my-5" />}
            </Fragment>
          ))}
        </div>
        <SubmitButton
          title="Add SDG"
          onSubmit={onAddSdg}
          className={cx('mr-auto h-8', { 'mt-4': sdgsData.length > 0 })}
        />
      </div>
    </>
  )
}

export default PCRSdgs
