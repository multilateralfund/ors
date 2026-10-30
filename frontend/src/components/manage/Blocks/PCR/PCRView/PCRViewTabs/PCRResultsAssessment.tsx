import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  SubSectionTitle,
  EntryIndex,
  NoDataReported,
} from './ViewHelperComponents'
import { pcrFieldsMapping, borderedContainerClassname } from '../../constants'
import { PCRResponse } from '../../interfaces'

import { filter, find, map } from 'lodash'
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
  const { agencies } = useContext(ProjectsDataContext)
  const { pcr: pcrData, agencyIds } = useContext(PCRDataContext)
  const pcr = pcrData.data as PCRResponse

  const [crtTab, setCrtTab] = useState(0)

  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const activitiesData = filter(
    pcr.overall_assessment_highlights,
    ({ agency_id }) => agency_id === crtAgencyId,
  )

  return (
    <>
      <SectionTitle>
        Project results: overall assessment highlights
      </SectionTitle>
      <Tabs
        aria-label="results-assessment-view-tabs"
        className="sectionsTabs mt-6"
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
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="border-0 border-t border-solid border-primary pt-6">
        <div className={cx('flex flex-col', borderedContainerClassname)}>
          <div className="bg-[#f4f5f6] px-6 py-4">
            <SubSectionTitle>
              Implementation effectiveness (achievement of activity output)
            </SubSectionTitle>
          </div>
          <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
            {activitiesData.length > 0 ? (
              <TableContainer
                component={Paper}
                className="PcrViewTableContainer"
              >
                <Table stickyHeader className="PcrViewTable">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell className="NameColumn">
                        {pcrFieldsMapping.activity_title}
                      </TableCell>
                      <TableCell>{pcrFieldsMapping.planned_output}</TableCell>
                      <TableCell>
                        {pcrFieldsMapping.actual_activity_output}
                      </TableCell>
                      <TableCell>
                        {pcrFieldsMapping.additional_remarks}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {map(activitiesData, (activity, activityIndex) => (
                      <TableRow key={activityIndex}>
                        <TableCell>
                          <EntryIndex index={activityIndex} />
                        </TableCell>
                        <TableCell className="NameColumn w-1/4">
                          {activity.activity_title || '-'}
                        </TableCell>
                        <TableCell className="w-1/4">
                          {activity.planned_output || '-'}
                        </TableCell>
                        <TableCell className="w-1/4">
                          {activity.actual_activity_output || '-'}
                        </TableCell>
                        <TableCell className="w-1/4">
                          {activity.additional_remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <NoDataReported text="No data reported." />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PCRResultsAssessment
