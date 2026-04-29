import { ProjectTabSetters } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { NavigationButton } from '../HelperComponents'
import { AnnualProjectReport } from '@ors/app/annual-project-report/types'

const ProjectHistory = ({
  aprData,
  setCurrentTab,
}: ProjectTabSetters & {
  aprData: (AnnualProjectReport & { year: number })[]
}) => {
  const latestApr = aprData[0]

  return (
    <>
      <div>
        Last Annual Progress Report: {latestApr.year}
        <div> Status: {latestApr.status}</div>
        <div>
          <span>Dates:</span>
          First Disbursement Date: {latestApr.date_first_disbursement}
          Planned Date of Completion: {latestApr.date_planned_completion}
          Date Completed (Actual): {latestApr.date_actual_completion}
          Date of Financial Completion: {latestApr.date_financial_completion}
        </div>
        <div>
          <span>Phase-out:</span>
          Consumption ODP/MT Phased Out: {latestApr.consumption_phased_out_odp}/
          {latestApr.consumption_phased_out_mt}
          Consumption Phased Out in CO2-eq Tonnes:{' '}
          {latestApr.consumption_phased_out_co2}, Production ODP/MT Phased Out:{' '}
          {latestApr.production_phased_out_odp}/
          {latestApr.production_phased_out_mt}, Production Phased Out in CO2-eq
          Tonnes: {latestApr.production_phased_out_co2},
        </div>
        <div>
          <span>Financial:</span>
          Funds Disbursed (US$): {latestApr.funds_disbursed}
          Funds Committed (US$): {latestApr.funds_committed}
          Estimated Disbursement in Current Year (US$):{' '}
          {latestApr.estimated_disbursement_current_year}
          Support Cost Disbursed (US$): {latestApr.support_cost_disbursed}
          Support Cost Committed (US$): {latestApr.support_cost_committed}
          Disbursements made to final beneficiaries from FECO/ MEP:{' '}
          {latestApr.disbursements_made_to_final_beneficiaries}
          Funds advanced (US$): {latestApr.funds_advanced}
        </div>
        <div>
          <span>Narrative & Indicators:</span>
          Remarks (as of 31 December {latestApr.year}):{' '}
          {latestApr.last_year_remarks}
          Remarks (Current year): {latestApr.current_year_remarks}
          Gender Policy for All Projects Approved from 85th Mtg :{' '}
          {latestApr.gender_policy}
        </div>
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
