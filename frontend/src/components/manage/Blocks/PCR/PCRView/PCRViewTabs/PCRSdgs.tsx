import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  EntryIndex,
  booleanDetailItem,
} from './ViewHelperComponents'
import { borderedContainerClassname, pcrFieldsMapping } from '../../constants'
import { PCRResponse } from '../../interfaces'

import { filter, find, keys, map } from 'lodash'
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

const PCRSdgs = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const agencySdgsData = filter(
    pcr.sustainable_development_goals,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )
  const sdgNotApplying =
    agencySdgsData.length > 0 ? agencySdgsData[0].sdg_not_applying : null
  const sdgsData = agencySdgsData.length > 0 ? agencySdgsData[0].goals : []

  return (
    <>
      <SectionTitle>
        Contribution to the Sustainable Development Goals (SDGs)
      </SectionTitle>
      <Tabs
        aria-label="sdgs-view-tabs"
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
        <div
          className={cx(
            'flex flex-col bg-white p-6',
            borderedContainerClassname,
          )}
        >
          {booleanDetailItem(pcrFieldsMapping.sdg_not_applying, sdgNotApplying)}
          <TableContainer component={Paper} className="PcrViewTableContainer">
            <Table stickyHeader className="PcrViewTable">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell className="NameColumn">
                    {pcrFieldsMapping.goal_id}
                  </TableCell>
                  <TableCell>
                    {pcrFieldsMapping.description} of contribution
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {map(sdgsData, (sdg, sdgIndex) => (
                  <TableRow key={sdgIndex}>
                    <TableCell>
                      <EntryIndex index={sdgIndex} />
                    </TableCell>
                    <TableCell className="NameColumn">
                      {sdg.goal || '-'}
                    </TableCell>
                    <TableCell>{sdg.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </>
  )
}

export default PCRSdgs
