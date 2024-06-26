import { useContext } from 'react'

import { FilesViewer } from '@ors/components/manage/Blocks/Section/ReportInfo/FilesViewer'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

function BPHistory() {
  const { data } = useContext(BPContext) as any
  const history = data?.results?.history
  return (
    <VersionHistoryList
      currentDataVersion={1}
      historyList={history}
      length={3}
      type="bp"
    />
  )
}

function BPSummary() {
  const { data } = useContext(BPContext) as any
  const { business_plan = {} } = data?.results
  const { agency, year_start } = business_plan

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
        {/*<SimpleField*/}
        {/*  id="username"*/}
        {/*  className="col-span-2 lg:col-span-1"*/}
        {/*  data={'Username'}*/}
        {/*  label="Username"*/}
        {/*/>*/}
        <SimpleField
          id="name_reporting_officer"
          data={'Name'}
          label="Name of reporting officer"
        />
        {/*<SimpleField*/}
        {/*  id="email_reporting_officer"*/}
        {/*  data={'Email'}*/}
        {/*  label="Email of reporting officer"*/}
        {/*/>*/}
        <SimpleField id="agency" data={agency?.name} label="Agency" />
        <SimpleField id="year" data={year_start} label="Year" />
      </div>

      <FilesViewer files={[]} heading={'File attachments'} isEdit={false} />
    </div>
  )
}

export default function BPDetails() {
  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <BPSummary />

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <BPHistory />
      </div>
    </section>
  )
}
