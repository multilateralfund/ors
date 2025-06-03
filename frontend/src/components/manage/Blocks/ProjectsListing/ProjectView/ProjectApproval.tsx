import {
  booleanDetailItem,
  dateDetailItem,
  detailItem,
} from './ViewHelperComponents'
import { ProjectTypeApi } from '../interfaces'

const ProjectApproval = ({ project }: { project: ProjectTypeApi }) => {
  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
            {detailItem('Programme officer name', project.programme_officer)}
            {detailItem('Funding window', project.funding_window)}
            {detailItem('Decision number', project.decision)}
            {dateDetailItem('Approval date', project.date_approved)}
          </div>
        </div>
      </div>
      {detailItem(
        'Excom Provision',
        project.excom_provision,
        'whitespace-nowrap mr-6',
      )}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
            {booleanDetailItem('Ad-hoc PCR', project.ad_hoc_pcr)}
            {booleanDetailItem('PCR waived', project.pcr_waived)}
            {dateDetailItem('Date of completion', project.date_completion)}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectApproval
