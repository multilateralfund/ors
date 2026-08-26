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
import { sdgsField } from '../constants'

import { Tabs, Tab, Divider } from '@mui/material'
import { filter, find, map, omit } from 'lodash'
import { IoTrash } from 'react-icons/io5'
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

  const crtAgencies = map(
    sectionData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency_id)?.name,
  )

  const onAddSdg = (agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []
      const initialSdgsData = { goal_id: null, description: '' }

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
            ? {
                ...data,
                [sdgsField]: [...data[sdgsField], initialSdgsData],
              }
            : data,
        ),
      }
    }, sdgsField)
  }

  const onRemoveSdg = (sdgIndex: number, agencyIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === agencyIndex
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
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-col gap-y-4">
          {map(sdgsData, (_, sdgIndex) => (
            <Fragment key={sdgIndex}>
              <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
                <PCRSelectWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="goal_id"
                  options={sdgsOptions}
                  errors={{}}
                  indexes={[crtTab, sdgIndex]}
                  subFields={['', sdgsField]}
                />
                <PCRTextAreaWidget
                  {...{ PCRData, setPCRData, sectionIdentifier }}
                  field="description"
                  errors={{}}
                  indexes={[crtTab, sdgIndex]}
                  subFields={['', sdgsField]}
                />
                <IoTrash
                  className="mt-12 min-h-6 min-w-6 cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveSdg(sdgIndex, crtTab)
                  }}
                />
              </div>
              {sdgIndex !== sdgsData.length - 1 && <Divider className="my-5" />}
            </Fragment>
          ))}
        </div>
        <SubmitButton
          title="Add SDG"
          onSubmit={() => onAddSdg(crtTab)}
          className={cx('mr-auto h-8', { 'mt-4': sdgsData.length > 0 })}
        />
      </div>
    </>
  )
}

export default PCRSdgs
