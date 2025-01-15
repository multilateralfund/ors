import {
  UserType,
  userCanEditBusinessPlan,
  userCanUpdateFilesBusinessPlan,
  userCanViewFilesBusinessPlan,
} from '@ors/types/user_types'

import { Dispatch, SetStateAction } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import { FilesViewer } from '../FilesViewer'
import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import {
  getDecisionNr,
  getDecisionOptions,
  getMeetingNr,
  getMeetingOptions,
} from '../utils'
import { Label } from '../BPUpload/helpers'
import { BpFilesObject, IDecision } from '../types'
import FileInput from '../BPEdit/FileInput'
import Field from '@ors/components/manage/Form/Field'

const BPSummary = (props: {
  results: any[]
  bpFiles: any[]
  files: BpFilesObject
  bpForm: any
  setBpForm: Dispatch<SetStateAction<any>>
  setFiles: React.Dispatch<React.SetStateAction<BpFilesObject>>
}) => {
  const { results, bpFiles, files, bpForm = {}, setBpForm, setFiles } = props
  const { year_end, year_start, status, meeting_id, decision_id } =
    results[0] || {}

  const { user_type } = useStore((state) => state.user.data)
  const canViewFiles = userCanViewFilesBusinessPlan[user_type as UserType]
  const canEditBp = userCanEditBusinessPlan[user_type as UserType]
  const canUpdateFiles = userCanUpdateFilesBusinessPlan[user_type as UserType]

  const handleChangeMeeting = (meeting: string) => {
    setBpForm((form: any) => ({ ...form, meeting, decision: null }))
  }

  const handleChangeDecision = (decision: IDecision) => {
    setBpForm((form: any) => ({
      ...form,
      decision: decision?.value,
    }))
  }

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
              <Label isRequired>Meeting number</Label>
              <PopoverInput
                key={bpForm?.meeting}
                className="!m-0 h-10 !py-1"
                options={getMeetingOptions()}
                onChange={handleChangeMeeting}
                label={getMeetingNr(bpForm.meeting)}
                value={bpForm.meeting}
              />
            </div>
            <div>
              <Label>Decision (optional)</Label>
              <Field
                key={bpForm.meeting + '-' + bpForm.decision}
                FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
                options={getDecisionOptions(bpForm.meeting)}
                widget="autocomplete"
                onChange={(_: any, value: any) => handleChangeDecision(value)}
                value={getDecisionNr(bpForm.decision)?.toString() || null}
              />
            </div>
          </>
        ) : (
          <>
            <SimpleField
              id="meeting"
              data={getMeetingNr(meeting_id)}
              label="Meeting number"
            />
            <SimpleField
              id="decision"
              data={getDecisionNr(decision_id) || '-'}
              label="Decision number"
            />
          </>
        )}
      </div>
      {canViewFiles && (
        <FilesViewer {...{ files, setFiles }} bpFiles={bpFiles || []} />
      )}
      {canUpdateFiles && <FileInput {...{ files, setFiles }} />}
    </div>
  )
}

export default function BPDetailsConsolidatedEdit({ data, ...props }: any) {
  return (
    <div className="flex flex-1 flex-col justify-start gap-6 border-0">
      <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
        <BPSummary {...props} />
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
