import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SectionTitle,
  EntryIndex,
  booleanDetailItem,
  SelectedEntity,
  NoDataReported,
  detailItem,
} from './ViewHelperComponents'
import { getValueClassName } from '../../utils'
import { PCRResponse } from '../../interfaces'
import {
  pcrFieldsMapping,
  textareaClassname,
  borderedContainerClassname,
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
  Divider,
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
  const sdgApplying = agencySdgsData.length > 0 ? true : null
  // agencySdgsData.length > 0 ? agencySdgsData[0].sdg_applying : null
  const formattedSdgApplying = sdgApplying ? 'Yes' : 'No'

  const sdgNotApplyingExplanation =
    agencySdgsData.length > 0
      ? agencySdgsData[0].sdg_not_applying_explanation
      : ''

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
          {booleanDetailItem(pcrFieldsMapping.sdg_applying, sdgApplying, {
            labelClassname: 'text-xl text-primary font-bold',
            valueClassname: cx(
              'rounded-full',
              getValueClassName(formattedSdgApplying),
            ),
          })}
          <Divider className="my-5" />
          {sdgApplying ? (
            <>
              <div className="mb-5 flex flex-row flex-wrap items-center gap-2.5">
                <span className="text-[#4D4D4D]">
                  SDGs selected ({sdgsData.length ?? 0})
                </span>
                {map(sdgsData, (sdg) =>
                  SelectedEntity(sdg.goal ? sdg.goal.split(':')[0] : '-'),
                )}
              </div>
              {sdgsData.length > 0 ? (
                <TableContainer
                  component={Paper}
                  className="PcrViewTableContainer"
                >
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
                          <TableCell className="NameColumn w-1/3">
                            {sdg.goal || '-'}
                          </TableCell>
                          <TableCell className="w-2/3">
                            {sdg.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <NoDataReported text="No data reported." />
              )}
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <NoDataReported
                text="No SDG contribution reported."
                additionalText="The agency confirmed that the project did not contribute to any Sustainable Development Goal."
              />
              {detailItem(
                pcrFieldsMapping.sdg_not_applying_explanation,
                sdgNotApplyingExplanation,
                textareaClassname,
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PCRSdgs
