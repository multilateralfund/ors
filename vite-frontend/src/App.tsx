import { Switch, Route, Redirect } from "wouter";

import LoginLayout from "@ors/app/login/layout";
import LoginPage from "@ors/app/login/page";

import CountryProgrammePage from "@ors/app/country-programme/reports/page";

import CPCreatePage from "@ors/app/country-programme/create/page";
import CPViewPage from "@ors/app/country-programme/[iso3]/[year]/page";
import CPEditPage from "@ors/app/country-programme/[iso3]/[year]/edit/page";
import CPPrintPage from "@ors/app/country-programme/[iso3]/[year]/print/page";
import CPDiffPage from "@ors/app/country-programme/[iso3]/[year]/diff/[version]/page";
import CPArchivePage from "@ors/app/country-programme/[iso3]/[year]/archive/[version_nr]/page";
import CPExportPage from "@ors/app/country-programme/export-data/page";
import CPSettingsPage from "@ors/app/country-programme/settings/page";

import ReplenishmentLayout from "@ors/app/replenishment/layout";
import ReplenishmentDashboardSectionPage from "@ors/app/replenishment/dashboard/[section]/page";
import ReplenishmentDashboardSectionPeriodPage from "@ors/app/replenishment/dashboard/[section]/[period]/page";
import ReplenishmentInOutFlowsPage from "@ors/app/replenishment/in-out-flows/[section]/page";
import ReplenishmentScaleOfAssessmentPage from "@ors/app/replenishment/scale-of-assessment/page";
import ReplenishmentScaleOfAssessmentPeriodPage from "@ors/app/replenishment/scale-of-assessment/[period]/page";
import ReplenishmentStatisticsPage from "@ors/app/replenishment/statistics/page";
import ReplenishmentStatusOfTheFundPage from "@ors/app/replenishment/status-of-the-fund/page";
import ReplenishmentStatusOfContributionsSummaryPage from "@ors/app/replenishment/status-of-contributions/summary/page";
import ReplenishmentStatusOfContributionsAnnualPage from "@ors/app/replenishment/status-of-contributions/annual/page";
import ReplenishmentStatusOfContributionsAnnualYearPage from "@ors/app/replenishment/status-of-contributions/annual/[year]/page";
import ReplenishmentStatusOfContributionsTriennialPage from "@ors/app/replenishment/status-of-contributions/triennial/page";
import ReplenishmentStatusOfContributionsTriennialPeriodPage from "@ors/app/replenishment/status-of-contributions/triennial/[period]/page";

import NotFoundPage from "@ors/app/not-found";

import RootLayout from './app/layout'

export default function App() {
  return (
      <RootLayout>
        <Switch>
          <Route path="/login">
            <LoginLayout>
              <LoginPage />
            </LoginLayout>
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
          <Route path="/">
            <Redirect to="/country-programme/reports" replace />
          </Route>
          <Route path="/replenishment" nest>
            <ReplenishmentLayout>
              <Redirect to="/dashboard" replace />
              <Route path="/dashboard" nest>
                <Redirect to="/cummulative" replace />
                <Route path="/:section/:period">
                  <ReplenishmentDashboardSectionPeriodPage />
                </Route>
                <Route path="/:section">
                  <ReplenishmentDashboardSectionPage />
                </Route>
              </Route>
              <Route path="/in-out-flows" nest>
                <Redirect to="/invoices" replace />
                <Route path="/:section">
                  <ReplenishmentInOutFlowsPage />
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
                <Redirect to="/summary" replace />
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
              </Route>
            </ReplenishmentLayout>
          </Route>
          <Route>
            <NotFoundPage />
          </Route>
        </Switch>
      </RootLayout>
  )
}
