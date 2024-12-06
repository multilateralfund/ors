import {
  UserType,
  userCanEditBusinessPlan,
  userCanUpdateFilesBusinessPlan,
  userCanViewFilesBusinessPlan,
} from '@ors/types/user_types'

import { ChangeEvent, Dispatch, SetStateAction, useEffect } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import { FilesViewer } from '../FilesViewer'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { getMeetingOptions } from '../utils'
import { Label } from '../BPUpload/helpers'
import { BpFilesObject } from '../types'
import FileInput from '../BPEdit/FileInput'

const BPSummary = (props: any) => {
  const { results, bpFiles, setBpForm, setFiles, files } = props
  const { year_end, year_start, status, meeting_number, decision_number } =
    results[0] || {}

  const { user_type } = useStore((state) => state.user.data)
  const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]
  const canEditBp = userCanEditBusinessPlan[user_type as UserType]
  const canUpdateFiles = userCanUpdateFilesBusinessPlan[user_type as UserType]

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
        {canEditBp ? (
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
      {setFiles && (
        <>
          {canViewFiles && (
            <FilesViewer {...{ files, setFiles }} bpFiles={bpFiles || []} />
          )}
          {canUpdateFiles && <FileInput {...{ files, setFiles }} />}
        </>
      )}
    </div>
  )
}

export default function BPDetailsConsolidatedEdit({
  setBpForm,
  setFiles,
  files,
  bpFiles,
  results,
  data,
}: {
  data: any
  results: []
  bpFiles: any[]
  setBpForm?: Dispatch<SetStateAction<any>>
  setFiles?: React.Dispatch<React.SetStateAction<BpFilesObject>>
  files?: any[]
}) {
  return (
    <div className="flex flex-1 flex-col justify-start gap-6 border-0">
      <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
        <BPSummary {...{ results, bpFiles, setBpForm, setFiles, files }} />
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
  )
}
