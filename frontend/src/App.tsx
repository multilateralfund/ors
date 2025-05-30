import { Switch, Route, Redirect, useLocation } from 'wouter'

import LoginLayout from '@ors/app/login/layout'

import LoginPage from '@ors/app/login/page'
import ResetPasswordPage from '@ors/app/reset-password/page'
import ForgotPasswordPage from '@ors/app/forgot-password/page'

import CountryProgrammePage from '@ors/app/country-programme/reports/page'

import CPCreatePage from '@ors/app/country-programme/create/page'
import CPViewPage from '@ors/app/country-programme/[iso3]/[year]/page'
import CPEditPage from '@ors/app/country-programme/[iso3]/[year]/edit/page'
import CPPrintPage from '@ors/app/country-programme/[iso3]/[year]/print/page'
import CPDiffPage from '@ors/app/country-programme/[iso3]/[year]/diff/[version]/page'
import CPArchivePage from '@ors/app/country-programme/[iso3]/[year]/archive/[version_nr]/page'
import CPExportPage from '@ors/app/country-programme/export-data/page'
import CPSettingsPage from '@ors/app/country-programme/settings/page'

import ReplenishmentLayout from '@ors/app/replenishment/layout'
import ReplenishmentDashboardSectionPage from '@ors/app/replenishment/dashboard/[section]/page'
import ReplenishmentDashboardSectionPeriodPage from '@ors/app/replenishment/dashboard/[section]/[period]/page'
import ReplenishmentInOutFlowsPage from '@ors/app/replenishment/in-out-flows/[section]/page'
import ReplenishmentScaleOfAssessmentPage from '@ors/app/replenishment/scale-of-assessment/page'
import ReplenishmentScaleOfAssessmentPeriodPage from '@ors/app/replenishment/scale-of-assessment/[period]/page'
import ReplenishmentStatisticsPage from '@ors/app/replenishment/statistics/page'
import ReplenishmentStatusOfTheFundPage from '@ors/app/replenishment/status-of-the-fund/page'
import ReplenishmentStatusOfContributionsSummaryPage from '@ors/app/replenishment/status-of-contributions/summary/page'
import ReplenishmentStatusOfContributionsAnnualPage from '@ors/app/replenishment/status-of-contributions/annual/page'
import ReplenishmentStatusOfContributionsAnnualYearPage from '@ors/app/replenishment/status-of-contributions/annual/[year]/page'
import ReplenishmentStatusOfContributionsTriennialPage from '@ors/app/replenishment/status-of-contributions/triennial/page'
import ReplenishmentStatusOfContributionsTriennialPeriodPage from '@ors/app/replenishment/status-of-contributions/triennial/[period]/page'

import BPPage from '@ors/app/business-plans/page'
import BPListLayout from '@ors/app/business-plans/list/layout'
import BusinessPlansDetailsConsolidated from './app/business-plans/list/details/[period]/page'
import BPListActivitiesPeriodPage from '@ors/app/business-plans/list/activities/[period]/page'
import BPListActivitiesPeriodTypeEditPage from '@ors/app/business-plans/list/[period]/[type]/edit/page'
import BPUpload from '@ors/app/business-plans/upload/page'

import ProjectsPage from '@ors/app/projects/page'
import ProjectsProjectPage from '@ors/app/projects/[project_id]/page'

import ProjectSubmissionsPage from '@ors/app/project-submissions/page'
import ProjectSubmissionsSubmissionPage from '@ors/app/project-submissions/[submission_id]/page'
import ProjectSubmissionsCreatePage from '@ors/app/project-submissions/create/page'
import ProjectSubmissionsEditPage from '@ors/app/project-submissions/edit/page'

import ProjectsListingPage from '@ors/app/projects_listing/page'
import ProjectsExportPage from '@ors/app/projects_listing/export/page'
import ProjectsCreatePage from '@ors/app/projects_listing/create/page'
import ProjectsCopyPage from '@ors/app/projects_listing/copy/page'
import ProjectsListingProjectPage from '@ors/app/projects_listing/[project_id]/page'
import ProjectsListingArchiveProjectPage from '@ors/app/projects_listing/[project_id]/archive/page'

import ProjectsListingEditProjectPage from '@ors/app/projects_listing/[project_id]/edit/page'

import NotFoundPage from '@ors/app/not-found'

import RootLayout from './app/layout'
import { useStore } from '@ors/store.tsx'

function RedirectToSection() {
  const user = useStore((state) => state.user)
  const isTreasurer = user && user.data.user_type === 'treasurer'
  const [_, setLocation] = useLocation()
  if (isTreasurer) {
    setLocation('/replenishment/dashboard/cummulative')
  } else {
    setLocation('/country-programme/reports')
  }
  return null
}

export default function App() {
  return (
    <RootLayout>
      <Switch>
        <Route path="/login">
          <LoginLayout>
            <LoginPage />
          </LoginLayout>
        </Route>
        <Route path="/reset-password">
          <LoginLayout>
            <ResetPasswordPage />
          </LoginLayout>
        </Route>
        <Route path="/forgot-password">
          <LoginLayout>
            <ForgotPasswordPage />
          </LoginLayout>
        </Route>
        <Route path="/business-plans/upload">
          <BPListLayout>
            <BPUpload />
          </BPListLayout>
        </Route>
        <Route path="/business-plans/list/report-info/:period">
          <BPListLayout>
            <BusinessPlansDetailsConsolidated />
          </BPListLayout>
        </Route>
        <Route path="/business-plans/list/:period/:type/edit">
          <BPListLayout>
            <BPListActivitiesPeriodTypeEditPage />
          </BPListLayout>
        </Route>
        <Route path="/business-plans/list/activities/:period">
          <BPListLayout>
            <BPListActivitiesPeriodPage />
          </BPListLayout>
        </Route>
        {/* <Route path="/business-plans/:agency/:period/:status?">
          <BPAgencyPeriodStatusPage />
        </Route> */}
        <Route path="/business-plans">
          <BPListLayout>
            <BPPage />
          </BPListLayout>
        </Route>
        <Route path="/country-programme/reports">
          <CountryProgrammePage />
        </Route>
        <Route path="/country-programme/create">
          <CPCreatePage />
        </Route>
        <Route path="/country-programme/:iso3/:year/archive/:version_nr">
          <CPArchivePage />
        </Route>
        <Route path="/country-programme/:iso3/:year/diff/:version">
          <CPDiffPage />
        </Route>
        <Route path="/country-programme/:iso3/:year/edit">
          <CPEditPage />
        </Route>
        <Route path="/country-programme/:iso3/:year/print">
          <CPPrintPage />
        </Route>
        <Route path="/country-programme/:iso3/:year">
          <CPViewPage />
        </Route>
        <Route path="/country-programme/export-data">
          <CPExportPage />
        </Route>
        <Route path="/country-programme/settings">
          <CPSettingsPage />
        </Route>
        <Route path="/country-programme">
          <Redirect to="/country-programme/reports" replace />
        </Route>
        <Route path="/">
          <RedirectToSection />
        </Route>
        <Route path="/replenishment" nest>
          <ReplenishmentLayout>
            <Route path="/dashboard" nest>
              <Route path="/:section/:period">
                <ReplenishmentDashboardSectionPeriodPage />
              </Route>
              <Route path="/:section">
                <ReplenishmentDashboardSectionPage />
              </Route>
              <Route path="/">
                <Redirect to="/cummulative" replace />
              </Route>
            </Route>
            <Route path="/in-out-flows" nest>
              <Route path="/:section">
                <ReplenishmentInOutFlowsPage />
              </Route>
              <Route path="/">
                <Redirect to="/invoices" replace />
              </Route>
            </Route>
            <Route path="/scale-of-assessment" nest>
              <Route path="/">
                <ReplenishmentScaleOfAssessmentPage />
              </Route>
              <Route path="/:period">
                <ReplenishmentScaleOfAssessmentPeriodPage />
              </Route>
            </Route>
            <Route path="/statistics">
              <ReplenishmentStatisticsPage />
            </Route>
            <Route path="/status-of-the-fund">
              <ReplenishmentStatusOfTheFundPage />
            </Route>
            <Route path="/status-of-contributions" nest>
              <Route path="/summary">
                <ReplenishmentStatusOfContributionsSummaryPage />
              </Route>
              <Route path="/triennial/:period">
                <ReplenishmentStatusOfContributionsTriennialPeriodPage />
              </Route>
              <Route path="/triennial">
                <ReplenishmentStatusOfContributionsTriennialPage />
              </Route>
              <Route path="/annual/:year">
                <ReplenishmentStatusOfContributionsAnnualYearPage />
              </Route>
              <Route path="/annual">
                <ReplenishmentStatusOfContributionsAnnualPage />
              </Route>
              <Route path="/">
                <Redirect to="/summary" replace />
              </Route>
            </Route>
            <Route path="/">
              <Redirect to="/dashboard" replace />
            </Route>
          </ReplenishmentLayout>
        </Route>
        <Route path="/project-submissions/create">
          <ProjectSubmissionsCreatePage />
        </Route>
        <Route path="/project-submissions/edit">
          <ProjectSubmissionsEditPage />
        </Route>
        <Route path="/project-submissions/:submission_id">
          <ProjectSubmissionsSubmissionPage />
        </Route>
        <Route path="/project-submissions/">
          <ProjectSubmissionsPage />
        </Route>
        <Route path="/projects/:project_id">
          <ProjectsProjectPage />
        </Route>
        <Route path="/projects">
          <ProjectsPage />
        </Route>
        <Route path="/projects-listing">
          <ProjectsListingPage />
        </Route>
        <Route path="/projects-listing/create">
          <ProjectsCreatePage />
        </Route>
        <Route path="/projects-listing/export">
          <ProjectsExportPage />
        </Route>
        <Route path="/projects-listing/create/copyFrom/:project_id">
          <ProjectsCopyPage />
        </Route>
        <Route path="/projects-listing/:project_id">
          <ProjectsListingProjectPage />
        </Route>
        <Route path="/projects-listing/:project_id/archive/:version">
          <ProjectsListingArchiveProjectPage />
        </Route>
        <Route path="/projects-listing/:project_id/edit">
          <ProjectsListingEditProjectPage />
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </RootLayout>
  )
}
