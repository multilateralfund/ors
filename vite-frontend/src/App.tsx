import { Switch, Route, Redirect } from "wouter";

import LoginLayout from "@ors/app/login/layout";
import LoginPage from "@ors/app/login/page";

import CountryProgrammePage from "@ors/app/country-programme/reports/page";

import RootLayout from './app/layout'

export default function App() {
  return (
    <div>
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
          <Route>
            <Redirect to="/country-programme/reports" replace />
          </Route>
        </Switch>
      </RootLayout>
    </div>
  )
}
