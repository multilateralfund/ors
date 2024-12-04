import {
  UserType,
  userCanUpdateFilesBusinessPlan,
  userCanViewFilesBusinessPlan,
} from '@ors/types/user_types'

import { useEffect, useState } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import FileInput from '../BPEdit/FileInput'
import { FilesViewer } from '../FilesViewer'
import BPListHeader from '../BPList/BPListHeader'
import BPListTabs from '../BPList/BPListTabs'
import { useBPListApi } from '../BPList/BPList'
import { bpTypes } from '../constants'
import { Status } from '@ors/components/ui/StatusPill/StatusPill'
import { useGetBpData } from './useGetBpData'

function BPHistory({ data }: any) {
  return (
    <VersionHistoryList
      currentDataVersion={1}
      historyList={data?.history || []}
      length={3}
      type="bp"
    />
  )
}

function BPSummary(props: any) {
  const { results, bpFiles } = props

  const { year_end, year_start, status, meeting_number, decision_number } =
    results[0] || {}

  const { user_type } = useStore((state) => state.user.data)
  const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]
  // const { bpFiles, files, setFiles } = props

  // const canUpdateFiles = userCanUpdateFilesBusinessPlan[user_type as UserType]

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField id="years" data={year_start} label="Year start" />
        <SimpleField id="years" data={year_end} label="Year end" />
        <SimpleField id="status" data={status} label="Status" />
        <SimpleField
          id="meeting"
          data={meeting_number || '-'}
          label="Meeting number"
        />
        <SimpleField
          id="decision"
          data={decision_number || '-'}
          label="Decision number"
        />
      </div>

      <>{canViewFiles && <FilesViewer bpFiles={bpFiles || []} />}</>

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

export default function BPDetailsConsolidated(props: any) {
  const { period } = props
  const { bpType, setBPType } = useStore((state) => state.bpType)

  const [filters, setFilters] = useState({
    status: (bpType || bpTypes[1].label) as Status,
    year_end: period?.split('-')[1] || null,
    year_start: period?.split('-')[0] || null,
  })

  const { data: bpFiles, setParams: setParamsFiles } = useGetBpData(
    filters,
    'api/business-plan/files/',
    'files',
  ) as any

  const { data, setParams: setParamsBpActivities } = useGetBpData(
    filters,
    'api/business-plan/get/',
    'fullData',
  ) as any as any

  const { results, setParams, params, loaded } = useBPListApi(filters)

  useEffect(() => {
    if (!bpType && loaded) {
      if (results.length === 0) {
        const defaultBpType = bpTypes[0].label

        setBPType(defaultBpType)
        setParams({ status: defaultBpType })
        setParamsFiles({ status: defaultBpType })
        setParamsBpActivities({ bp_status: defaultBpType })
        setFilters((filters) => ({
          ...filters,
          status: defaultBpType as Status,
        }))
      } else {
        setBPType(bpTypes[1].label)
      }
    }
  }, [results, loaded])

  return (
    <>
      {loaded && (
        <>
          <BPListHeader
            viewType="details"
            {...{ params, setParams, setParamsFiles, setParamsBpActivities }}
          />
          <BPListTabs />
          <div className="flex flex-1 flex-col justify-start gap-6 border-0 border-t border-solid border-primary pt-6">
            <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
              <BPSummary {...{ results, bpFiles }} />

              <div className="flex flex-col rounded-lg bg-gray-100 p-4">
                <BPHistory data={data} />
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}
