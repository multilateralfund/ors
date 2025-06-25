import { Dispatch, SetStateAction, useContext } from 'react'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import {
  getMeetingNr,
  getMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { HeaderWithIcon } from '@ors/components/ui/SectionHeader/SectionHeader'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FilesViewer } from '../FilesViewer'
import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { Label } from '../BPUpload/helpers'
import { BpFilesObject } from '../types'
import FileInput from '../BPEdit/FileInput'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'

import { BsFilesAlt } from 'react-icons/bs'
import { Divider } from '@mui/material'

const BPSummary = (props: {
  business_plan: any
  bpFiles: any[]
  files: BpFilesObject
  bpForm: any
  setBpForm: Dispatch<SetStateAction<any>>
  setFiles: React.Dispatch<React.SetStateAction<BpFilesObject>>
}) => {
  const {
    business_plan,
    bpFiles,
    files,
    bpForm = {},
    setBpForm,
    setFiles,
  } = props
  const { year_end, year_start, status, meeting_id, decision_id } =
    business_plan || {}

  const { canUpdateBp } = useContext(PermissionsContext)

  const handleChangeMeeting = (meeting: string) => {
    setBpForm((form: any) => ({ ...form, meeting }))
  }

  const handleChangeDecision = (event: any) => {
    setBpForm((form: any) => ({
      ...form,
      decision: event.target.value,
    }))
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white p-6">
      <HeaderWithIcon title="Summary" Icon={BsFilesAlt} />
      <div className="grid w-full grid-cols-2 grid-rows-3 gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <SimpleField
          id="years"
          data={year_start}
          label="Year start"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="years"
          data={year_end}
          label="Year end"
          textClassName="text-[1.25rem]"
        />
        <SimpleField
          id="status"
          data={status}
          label="Status"
          textClassName="text-[1.25rem]"
        />
        {canUpdateBp ? (
          <>
            <div>
              <Label isRequired>Meeting number</Label>
              <PopoverInput
                key={bpForm?.meeting}
                className="!m-0 h-10 !py-1"
                options={getMeetingOptions()}
                onChange={handleChangeMeeting}
                label={getMeetingNr(bpForm.meeting)?.toString()}
                value={bpForm.meeting}
              />
            </div>
            <div>
              <Label>Decision (optional)</Label>
              {/* <Field
                key={bpForm.meeting + '-' + bpForm.decision}
                FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
                options={getDecisionOptions(bpForm.meeting)}
                widget="autocomplete"
                onChange={(_: any, value: any) => handleChangeDecision(value)}
                value={getDecisionNr(bpForm.decision)?.toString() || null}
              /> */}
              <SimpleInput
                id={bpForm.meeting + '-' + bpForm.decision}
                containerClassName="!h-fit"
                className="BPListUpload mb-0 w-40 !border-primary"
                type="text"
                label=""
                value={bpForm?.decision}
                onChange={handleChangeDecision}
              />
            </div>
          </>
        ) : (
          <>
            <SimpleField
              id="meeting"
              data={getMeetingNr(meeting_id)?.toString() ?? ''}
              label="Meeting number"
              textClassName="text-[1.25rem]"
            />
            <SimpleField
              id="decision"
              data={decision_id || '-'}
              label="Decision number"
              textClassName="text-[1.25rem]"
            />
          </>
        )}
      </div>
      <Divider />
      <FilesViewer {...{ files, setFiles }} bpFiles={bpFiles || []} />
      {canUpdateBp && <FileInput {...{ files, setFiles }} />}
    </div>
  )
}

export default function BPDetailsConsolidatedEdit({ data, ...props }: any) {
  return (
    <div className="flex flex-1 flex-col justify-start gap-6 border-0">
      <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
        <BPSummary {...props} />
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
  )
}
