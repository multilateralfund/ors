import { ApiBPGet } from '@ors/types/api_bp_get'

import { useContext } from 'react'

import { isEmpty } from 'lodash'

import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

import FileInput from '../BPEdit/FileInput'
import { FilesViewer } from '../FilesViewer'

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

function BPSummary(props: {
  business_plan?: ApiBPGet
  files?: FileList
  isEdit?: boolean
  setFiles?: React.Dispatch<React.SetStateAction<FileList | null>>
}) {
  const { business_plan, files, isEdit = false, setFiles } = props
  const { data } = useContext(BPContext) as any

  const crtBp =
    business_plan && !isEmpty(business_plan)
      ? business_plan
      : data?.results.business_plan || {}

  const { agency, year_start } = crtBp

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
      {isEdit && setFiles ? (
        <>
          <FilesViewer business_plan={crtBp} />
          <FileInput {...{ files, setFiles }} />
        </>
      ) : (
        <FilesViewer business_plan={crtBp} />
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
