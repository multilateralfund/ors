import { useContext } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

import FileInput from '../BPEdit/FileInput'
import { FilesViewer } from '../FilesViewer'
import { BpDetails, BpFilesObject } from '../types'

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

function BPSummary(props: BpDetails) {
  const { bpFiles, files, setFiles } = props

  const { data } = useContext(BPContext) as any
  const { business_plan = {} } = data?.results
  const { agency, year_start } = business_plan

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField
          id="name_reporting_officer"
          data={'Name'}
          label="Name of reporting officer"
        />
        <SimpleField id="agency" data={agency?.name} label="Agency" />
        <SimpleField id="year" data={year_start} label="Year" />
      </div>
      {setFiles ? (
        <>
          <FilesViewer {...{ bpFiles, files, setFiles }} />
          <FileInput {...{ files, setFiles }} />
        </>
      ) : (
        <FilesViewer bpFiles={bpFiles} />
      )}
    </div>
  )
}

export default function BPDetails(props: any) {
  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <BPSummary {...props} />

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <BPHistory />
      </div>
    </section>
  )
}
