import { UserType, userCanViewFilesBusinessPlan } from '@ors/types/user_types'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import { FilesViewer } from '../FilesViewer'
import BPListHeader from '../BPList/BPListHeader'
import BPListTabs from '../BPList/BPListTabs'
import { useBPListApi } from '../BPList/BPList'
import { useGetBpData } from './useGetBpData'
import { getMeetingNr } from '../utils'
import BPTableToolbarButtons from '../BPTableToolbarButtons'

const BPSummary = (props: any) => {
  const { results, bpFiles, loadedFiles } = props
  const { year_end, year_start, status, meeting_id, decision_id } =
    results[0] || {}

  const { user_type } = useStore((state) => state.user.data)
  const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField id="years" data={year_start || '-'} label="Year start" />
        <SimpleField id="years" data={year_end || '-'} label="Year end" />
        <SimpleField id="status" data={status || '-'} label="Status" />
        <SimpleField
          id="meeting"
          data={getMeetingNr(meeting_id) || '-'}
          label="Meeting number"
        />
        <SimpleField
          id="decision"
          data={decision_id || '-'}
          label="Decision number"
        />
      </div>
      {canViewFiles && loadedFiles && <FilesViewer bpFiles={bpFiles || []} />}
    </div>
  )
}

export default function BPDetailsConsolidated({
  period,
  bpType,
}: {
  period: string
  bpType: string
}) {
  const [year_start, year_end] = period.split('-')

  const filters = {
    status: bpType,
    year_end: year_end || null,
    year_start: year_start || null,
  }

  const {
    data: bpFiles,
    setParams: setParamsFiles,
    loaded: loadedFiles,
  } = useGetBpData(filters, 'api/business-plan/files/', 'files') as any

  const { data, setParams: setParamsActivities } = useGetBpData(
    filters,
    'api/business-plan/get/',
    'fullData',
  ) as any

  const { results, setParams, loaded } = useBPListApi(filters)

  return (
    loaded && (
      <>
        <BPTableToolbarButtons />
        <BPListHeader
          viewType="details"
          {...{ setParams, setParamsFiles, setParamsActivities }}
        />
        <BPListTabs />
        <div className="flex flex-1 flex-col justify-start gap-6 border-0 border-t border-solid border-primary pt-6">
          <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
            <BPSummary {...{ results, bpFiles, loadedFiles }} />
            <div className="flex flex-col rounded-lg bg-gray-100 p-4">
              <VersionHistoryList
                currentDataVersion={1}
                historyList={data?.history || []}
                length={3}
                type="bp"
              />
            </div>
          </section>
        </div>
      </>
    )
  )
}
