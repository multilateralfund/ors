import {
  SectionTitle,
  SubSectionTitle,
  EntryIndex,
  NoDataReported,
} from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import { pcrFieldsMapping, borderedContainerClassname } from '../../constants'
import { ArchivePCRResponse } from '../../interfaces'

import { map } from 'lodash'
import cx from 'classnames'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'

const PCRArchiveResultsAssessment = ({ pcr }: { pcr: ArchivePCRResponse }) => {
  const activitiesData = pcr.activities

  return (
    <>
      <SectionTitle>
        Project results: overall assessment highlights
      </SectionTitle>
      <div className={cx('mt-6 flex flex-col', borderedContainerClassname)}>
        <div className="bg-[#f4f5f6] px-6 py-4">
          <SubSectionTitle>
            Implementation effectiveness (achievement of activity output)
          </SubSectionTitle>
        </div>
        <div className="flex flex-col border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
          {activitiesData.length > 0 ? (
            <TableContainer component={Paper} className="PcrViewTableContainer">
              <Table stickyHeader className="PcrViewTable">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell className="NameColumn">
                      Type of activity
                    </TableCell>
                    <TableCell>{pcrFieldsMapping.sector}</TableCell>
                    <TableCell>Sector type</TableCell>
                    <TableCell>{pcrFieldsMapping.planned_output}</TableCell>
                    <TableCell>
                      {pcrFieldsMapping.actual_activity_output}
                    </TableCell>
                    <TableCell>Evaluation</TableCell>
                    <TableCell>Explanation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {map(activitiesData, (activity, activityIndex) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <EntryIndex index={activityIndex} />
                      </TableCell>
                      <TableCell className="NameColumn w-1/5">
                        {activity.type_of_activity || '-'}
                      </TableCell>
                      <TableCell className="w-[12%]">
                        {activity.sector || '-'}
                      </TableCell>
                      <TableCell className="w-[12%] min-w-36">
                        {activity.sector_type || '-'}
                      </TableCell>
                      <TableCell className="w-1/5">
                        {activity.planned_output || '-'}
                      </TableCell>
                      <TableCell className="w-1/5">
                        {activity.actual_activity_output || '-'}
                      </TableCell>
                      <TableCell>{activity.evaluation ?? '-'}</TableCell>
                      <TableCell className="w-1/5">
                        {activity.explanation || '-'}
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
    </>
  )
}

export default PCRArchiveResultsAssessment
