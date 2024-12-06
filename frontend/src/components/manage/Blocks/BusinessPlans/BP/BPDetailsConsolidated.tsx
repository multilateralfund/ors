import {
  UserType,
  userCanEditBusinessPlan,
  userCanViewFilesBusinessPlan,
} from '@ors/types/user_types'

import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import { FilesViewer } from '../FilesViewer'
import BPListHeader from '../BPList/BPListHeader'
import BPListTabs from '../BPList/BPListTabs'
import { useBPListApi } from '../BPList/BPList'
import { bpTypes } from '../constants'
import { useGetBpData } from './useGetBpData'
import { useParams } from 'wouter'
import cx from 'classnames'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { getMeetingOptions } from '../utils'
import { Label } from '../BPUpload/helpers'

const BPSummary = (props: any) => {
  const { results, bpFiles, isEdit, setBpForm } = props
  const { year_end, year_start, status, meeting_number, decision_number } =
    results[0] || {}

  const { user_type } = useStore((state) => state.user.data)
  const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]
  const canEditBp = userCanEditBusinessPlan[user_type as UserType]

  const handleChangeMeeting = (meeting: string) => {
    setBpForm((form: any) => ({ ...form, meeting }))
  }

  const handleChangeDecision = (event: ChangeEvent<HTMLInputElement>) => {
    setBpForm((form: any) => ({ ...form, decision: event.target.value }))
  }

  useEffect(() => {
    if (setBpForm) {
      setBpForm({ meeting: meeting_number, decision: decision_number })
    }
  }, [results])

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
      <p className="m-0 text-2xl font-normal">Summary</p>
      <div className="grid w-full grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField id="years" data={year_start} label="Year start" />
        <SimpleField id="years" data={year_end} label="Year end" />
        <SimpleField id="status" data={status} label="Status" />
        {isEdit && canEditBp ? (
          <>
            <div>
              <Label isRequired>Meeting</Label>
              <PopoverInput
                className="!m-0 h-10 !py-1"
                options={getMeetingOptions()}
                onChange={handleChangeMeeting}
                value={meeting_number}
              />
            </div>
            <SimpleInput
              id="decision"
              label="Decision number"
              type="text"
              className="!border-black"
              defaultValue={decision_number}
              onChange={handleChangeDecision}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {canViewFiles && <FilesViewer bpFiles={bpFiles || []} />}
    </div>
  )
}

export default function BPDetailsConsolidated({
  isEdit = false,
  setBpForm,
}: {
  isEdit?: boolean
  setBpForm?: Dispatch<SetStateAction<any>>
}) {
  const { period } = useParams<Record<string, string>>()

  const { bpType, setBPType } = useStore((state) => state.bpType)

  const [year_start, year_end] = period.split('-')

  const [filters, setFilters] = useState({
    status: bpType || bpTypes[1].label,
    year_end: year_end || null,
    year_start: year_start || null,
  })

  const { data: bpFiles, setParams: setParamsFiles } = useGetBpData(
    filters,
    'api/business-plan/files/',
    'files',
  ) as any

  const { data, setParams: setParamsActivities } = useGetBpData(
    filters,
    'api/business-plan/get/',
    'fullData',
  ) as any

  const { results, setParams, loaded } = useBPListApi(filters)

  useEffect(() => {
    if (!bpType && loaded) {
      if (results.length === 0) {
        const defaultBpType = bpTypes[0].label

        setBPType(defaultBpType)
        setParams({ status: defaultBpType })
        setParamsFiles({ status: defaultBpType })
        setParamsActivities({ bp_status: defaultBpType })
        setFilters((filters) => ({
          ...filters,
          status: defaultBpType,
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
          {!isEdit && (
            <>
              <BPListHeader
                viewType="details"
                {...{ setParams, setParamsFiles, setParamsActivities }}
              />
              <BPListTabs />
            </>
          )}
          <div
            className={cx('flex flex-1 flex-col justify-start gap-6 border-0', {
              'border-t border-solid border-primary pt-6': !isEdit,
            })}
          >
            <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
              <BPSummary {...{ results, bpFiles, isEdit, setBpForm }} />
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
      )}
    </>
  )
}
