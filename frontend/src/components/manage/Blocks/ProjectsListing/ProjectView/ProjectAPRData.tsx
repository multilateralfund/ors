import { ProjectTabSetters } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { AnnualProjectReport } from '@ors/app/annual-project-report/types'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { NavigationButton } from '../HelperComponents'
import {
  booleanDetailItem,
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import { viewColumnsClassName } from '../constants'
import { formatFieldLabel } from '../utils'

import { Divider, Typography } from '@mui/material'
import { keys, map } from 'lodash'

const ProjectHistory = ({
  aprData,
  setCurrentTab,
}: ProjectTabSetters & {
  aprData: (AnnualProjectReport & { year: number })[]
}) => {
  const latestApr = aprData[0]

  const dateFields: Record<string, string> = {
    date_first_disbursement: 'First Disbursement Date',
    date_planned_completion: 'Planned Date of Completion',
    date_actual_completion: 'Date Completed (Actual)',
    date_financial_completion: 'Date of Financial Completion',
  }

  const phaseoutFields: Record<string, string> = {
    consumption_phased_out_odp: 'Consumption Phased Out (ODP tonnes)',
    consumption_phased_out_mt: 'Consumption Phased Out (metric tonnes)',
    consumption_phased_out_co2: 'Consumption Phased Out (CO2-eq tonnes)',
    production_phased_out_odp: 'Production Phased Out (ODP tonnes)',
    production_phased_out_mt: 'Production Phased Out (metric tonnes)',
    production_phased_out_co2: 'Production Phased Out (CO2-eq tonnes)',
  }

  const financialFields: Record<string, string> = {
    funds_disbursed: 'Funds Disbursed (US$)',
    funds_committed: 'Funds Committed (US$)',
    estimated_disbursement_current_year:
      'Estimated Disbursement in Current Year (US$)',
    support_cost_disbursed: 'Support Cost Disbursed (US$)',
    support_cost_committed: 'Support Cost Committed (US$)',
    disbursements_made_to_final_beneficiaries:
      'Disbursements made to final beneficiaries from FECO/MEP',
    funds_advanced: 'Funds advanced (US$)',
  }

  const textFields: Record<string, string> = {
    last_year_remarks: `Remarks (as of 31 December ${latestApr.year})`,
    current_year_remarks: 'Remarks (Current year)',
  }

  const booleanFields: Record<string, string> = {
    gender_policy: 'Gender Policy for All Projects Approved from 85th Mtg',
  }

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <Typography variant="h6">
          Last Annual Progress Report: {latestApr.year}
        </Typography>
        <div className="my-4">{detailItem('Status', latestApr.status)}</div>
        <>
          <SectionTitle>Dates</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className={viewColumnsClassName}>
              {map(keys(dateFields), (field) =>
                dateDetailItem(
                  dateFields[field],
                  latestApr[field as keyof typeof latestApr] as string,
                ),
              )}
            </div>
          </div>
        </>
        <Divider className="my-6" />
        <>
          <SectionTitle>Phase-out</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className={viewColumnsClassName}>
              {map(keys(phaseoutFields).slice(0, 3), (field) =>
                numberDetailItem(
                  formatFieldLabel(phaseoutFields[field]),
                  latestApr[field as keyof typeof latestApr] as string,
                  'decimal',
                ),
              )}
            </div>
            <div className={viewColumnsClassName}>
              {map(keys(phaseoutFields).slice(3), (field) =>
                numberDetailItem(
                  formatFieldLabel(phaseoutFields[field]),
                  latestApr[field as keyof typeof latestApr] as string,
                  'decimal',
                ),
              )}
            </div>
          </div>
        </>
        <Divider className="my-6" />
        <>
          <SectionTitle>Financial</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            <div className={viewColumnsClassName}>
              {map(keys(financialFields), (field) =>
                numberDetailItem(
                  financialFields[field],
                  latestApr[field as keyof typeof latestApr] as string,
                  'decimal',
                ),
              )}
            </div>
          </div>
        </>
        <Divider className="my-6" />
        <>
          <SectionTitle>Narrative & Indicators</SectionTitle>
          <div className="flex w-full flex-col gap-4">
            {map(keys(textFields), (field) =>
              detailItem(
                textFields[field],
                latestApr[field as keyof typeof latestApr] as string,
                {
                  detailClassname: 'self-start',
                },
              ),
            )}
            {map(keys(booleanFields), (field) =>
              booleanDetailItem(
                booleanFields[field],
                (latestApr[field as keyof typeof latestApr] ??
                  false) as boolean,
              ),
            )}
          </div>
        </>
      </div>
      {setCurrentTab && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
          <NavigationButton {...{ setCurrentTab }} />
        </div>
      )}
    </>
  )
}

export default ProjectHistory
