import { useContext, useState } from 'react'

import { ErrorsList } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { EditSectionIndicator, AddEntityButton } from './EditHelperComponents'
import { TabLabel, PCRTextWidget, PCRTextAreaWidget } from './PCRWidgets'
import {
  SubSectionTitle,
  EntryIndex,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import {
  pcrFieldsMapping,
  initialActivitiesData,
  borderedContainerClassname,
} from '../constants'
import { getSectionAgencies, formatErrors, getErrorIndex } from '../utils'

import { filter, keys, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import cx from 'classnames'
import {
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'

const PCRResultsAssessment = () => {
  const sectionIdentifier = 'results_assessment'
  const activityField = 'activities'

  const { PCRData, setPCRData, errors, setErrors } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const sectionData = PCRData[sectionIdentifier] || []
  const activitiesData = sectionData[crtTab][activityField] || []
  const crtAgencyId = sectionData[crtTab].agency_id
  const crtAgencies = getSectionAgencies(agencies, sectionData)

  const { results_assessment: resultsAssessmentErrors } = errors
  const activitiesErrors = resultsAssessmentErrors[activityField]

  const agencyErrors = map(activitiesErrors[crtAgencyId], 'errors')
  const formattedAgencyErrors = formatErrors({ [activityField]: agencyErrors })

  const onAddActivity = () => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [activityField]: [
                  ...data[activityField],
                  initialActivitiesData,
                ],
              }
            : data,
        ),
      }
    }, activityField)
  }

  const onRemoveActivity = (activityIndex: number) => {
    setPCRData((prevData) => {
      const sectionData = prevData[sectionIdentifier] || []

      return {
        ...prevData,
        [sectionIdentifier]: sectionData.map((data, dataIndex) =>
          dataIndex === crtTab
            ? {
                ...data,
                [activityField]: data[activityField].filter(
                  (_, crtActivityIndex) => crtActivityIndex !== activityIndex,
                ),
              }
            : data,
        ),
      }
    }, activityField)

    setErrors((prevData: Record<string, any[]>) => {
      const errorIndex = getErrorIndex(
        sectionData,
        activityField,
        crtAgencyId,
        activityIndex,
      )

      return {
        ...prevData,
        [activityField]: filter(
          prevData[activityField],
          (_, index) => index !== errorIndex,
        ),
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Tabs
          aria-label="results-assessment-tabs"
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
                  field={activityField}
                  errors={activitiesErrors}
                  {...{ agency }}
                />
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
        <div className={cx('flex flex-col', borderedContainerClassname)}>
          <div className="bg-[#f4f5f6] px-6 py-4">
            <SubSectionTitle>
              Implementation effectiveness (achievement of activity output)
            </SubSectionTitle>
          </div>
          <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
            {activitiesData.length > 0 && (
              <TableContainer
                component={Paper}
                className="PcrViewTableContainer"
              >
                <Table stickyHeader className="PcrViewTable">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{pcrFieldsMapping.activity_title}</TableCell>
                      <TableCell>{pcrFieldsMapping.planned_output}</TableCell>
                      <TableCell>
                        {pcrFieldsMapping.actual_activity_output}
                      </TableCell>
                      <TableCell>
                        {pcrFieldsMapping.additional_remarks}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {map(activitiesData, (_, activityIndex) => (
                      <TableRow key={activityIndex}>
                        <TableCell>
                          <EntryIndex index={activityIndex} />
                        </TableCell>
                        <TableCell className="w-1/4">
                          <PCRTextWidget
                            {...{ PCRData, setPCRData, sectionIdentifier }}
                            field="activity_title"
                            className="w-full md:!min-w-full"
                            errors={agencyErrors}
                            indexes={[crtTab, activityIndex]}
                            subFields={['', activityField]}
                            excludeLabel={true}
                          />
                        </TableCell>
                        {map(
                          keys(initialActivitiesData).slice(1),
                          (field, fieldIndex) => (
                            <TableCell key={fieldIndex} className="w-1/4">
                              <PCRTextAreaWidget
                                {...{
                                  PCRData,
                                  setPCRData,
                                  sectionIdentifier,
                                  field,
                                }}
                                errors={agencyErrors}
                                indexes={[crtTab, activityIndex]}
                                subFields={['', activityField]}
                                excludeLabel={true}
                                className="md:!min-w-full"
                              />
                            </TableCell>
                          ),
                        )}
                        <TableCell className="text-center align-middle">
                          <IoTrash
                            className="mx-auto min-h-6 min-w-6 cursor-pointer fill-[#8a2323]"
                            size={16}
                            onClick={() => {
                              onRemoveActivity(activityIndex)
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <AddEntityButton
              title="Add activity"
              action={onAddActivity}
              nrEntities={activitiesData.length}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
