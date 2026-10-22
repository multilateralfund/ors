import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  EntryIndex,
  NoDataReported,
} from './ViewHelperComponents'
import { getValueClassName } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  borderedContainerClassname,
  borderedValueClassname,
} from '../../constants'

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

const PCRGenderMainstreaming = ({ pcr }: { pcr: PCRResponse }) => {
  const { fundsByAgency } = useContext(PCRDataContext)
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = agencyIds[crtTab]
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const ppData = filter(
    pcr.gender_mainstreamings,
    ({ agency_id }) => agency_id === Number(crtAgencyId),
  )

  return (
    <>
      <SectionTitle>Gender mainstreaming</SectionTitle>
      <Tabs
        aria-label="gender-mainstreaming-view-tabs"
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
          {ppData.length > 0 ? (
            <TableContainer component={Paper} className="PcrViewTableContainer">
              <Table stickyHeader className="PcrViewTable">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell className="NameColumn">
                      {pcrFieldsMapping.project_preparation}
                    </TableCell>
                    <TableCell>{pcrFieldsMapping.prefilled}</TableCell>
                    <TableCell>
                      {pcrFieldsMapping.qualitative_description}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {map(ppData, (pp, ppIndex) => {
                    const prefilled = pp.prefilled ? 'Yes' : 'No'

                    return (
                      <TableRow key={ppIndex}>
                        <TableCell>
                          <EntryIndex index={ppIndex} />
                        </TableCell>
                        <TableCell className="NameColumn w-[20%]">
                          {pp.project_preparation || '-'}
                        </TableCell>
                        <TableCell className="w-[20%]">
                          {prefilled ? (
                            <div
                              className={cx(
                                'rounded-full',
                                borderedValueClassname,
                                getValueClassName(prefilled),
                              )}
                            >
                              {prefilled}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="w-[60%]">
                          {pp.qualitative_description || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

export default PCRGenderMainstreaming
