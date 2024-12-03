import {
  UserType,
  userCanUpdateFilesBusinessPlan,
  userCanViewFilesBusinessPlan,
} from '@ors/types/user_types'

import { useContext } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import { useStore } from '@ors/store'

import FileInput from '../BPEdit/FileInput'
import { FilesViewer } from '../FilesViewer'
import { BpDetails } from '../types'
import BPListHeader from '../BPList/BPListHeader'
import BPListTabs from '../BPList/BPListTabs'
import { useBPListApi } from '../BPList/BPList'
import { bpTypes } from '../constants'

function BPHistory() {
  // const { data } = useContext(BPContext) as any
  // const history = data?.results?.history
  return (
    <VersionHistoryList
      currentDataVersion={1}
      historyList={[]}
      length={3}
      type="bp"
    />
  )
}

function BPSummary(props: any) {
  const { results } = props

  console.log(results)
  const bp = results[0]
  // const { bpFiles, files, setFiles } = props

  // const { data } = useContext(BPContext) as any
  // const { business_plan = {} } = data?.results
  // const { agency, year_start } = business_plan

  // const { user_type } = useStore((state) => state.user.data)
  // const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]
  // const canUpdateFiles = userCanUpdateFilesBusinessPlan[user_type as UserType]

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField id="years" data={bp?.year_start} label="Year start" />
        <SimpleField id="years" data={bp?.year_end} label="Year end" />
        <SimpleField id="status" data={bp?.status} label="Status" />
        <SimpleField
          id="meeting"
          data={bp?.meeting_number || '-'}
          label="Meeting number"
        />
        <SimpleField
          id="decision"
          data={bp?.decision || '-'}
          label="Decision number"
        />
        {/* <SimpleField id="agency" data={agency?.name} label="Agency" />
        <SimpleField id="year" data={year_start} label="Year" /> */}
      </div>

      {/* {setFiles ? (
        <>
          {canViewFiles && <FilesViewer {...{ bpFiles, files, setFiles }} />}
          {canUpdateFiles && <FileInput {...{ files, setFiles }} />}
        </>
      ) : (
        canViewFiles && <FilesViewer bpFiles={bpFiles} />
      )} */}
    </div>
  )
}

export default function BPDetailsFull(props: any) {
  const { period } = props

  const filters = {
    status: bpTypes[1].label,
    year_end: period?.split('-')[1] || null,
    year_start: period?.split('-')[0] || null,
  }

  const { results, setParams, params, loading } = useBPListApi(filters)
  return (
    <>
      {!loading && (
        <>
          <BPListHeader viewType="details" {...{ params, setParams }} />
          <BPListTabs />
          <div className="flex flex-1 flex-col justify-start gap-6 border-0 border-t border-solid border-primary pt-6">
            <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
              <BPSummary {...props} results={results} />

              <div className="flex flex-col rounded-lg bg-gray-100 p-4">
                <BPHistory />
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}
