import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import BPTableToolbarButtons from '../BPTableToolbarButtons'
import BPListHeader from '../BPList/BPListHeader'
import BPListTabs from '../BPList/BPListTabs'
import { useBPListApi } from '../BPList/BPList'
import { FilesViewer } from '../FilesViewer'
import { useGetBpData } from './useGetBpData'

import { BsFilesAlt } from 'react-icons/bs'
import { Divider } from '@mui/material'

const BPSummary = (props: any) => {
  const { results, bpFiles, loadedFiles } = props
  const { year_end, year_start, status, meeting_id, decision_id } =
    results[0] || {}

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
      <HeaderWithIcon title="Summary" Icon={BsFilesAlt} />
      <div className="grid w-full grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField
          id="years"
          data={year_start || '-'}
          label="Year start"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="years"
          data={year_end || '-'}
          label="Year end"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="status"
          data={status || '-'}
          label="Status"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="meeting"
          data={getMeetingNr(meeting_id)?.toString() || '-'}
          label="Meeting number"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="decision"
          data={decision_id || '-'}
          label="Decision number"
          textClassName="text-[1.25rem]"
        />
      </div>
      <Divider />
      {loadedFiles && <FilesViewer bpFiles={bpFiles || []} />}
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
          viewType="report_info"
          {...{ setParams, setParamsFiles, setParamsActivities }}
        />
        <BPListTabs />
        <div className="flex flex-1 flex-col justify-start gap-6 border-0 border-t border-solid border-primary pt-6">
          <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
            <BPSummary {...{ results, bpFiles, loadedFiles }} />
            <div className="flex flex-col rounded-lg bg-white p-6">
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
