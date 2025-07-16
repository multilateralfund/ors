import {
  booleanDetailItem,
  dateDetailItem,
  detailItem,
} from './ViewHelperComponents'
import { ProjectTypeApi } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

const ProjectApproval = ({ project }: { project: ProjectTypeApi }) => {
  const { viewableFields } = useStore((state) => state.projectFields)

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
            {canViewField(viewableFields, 'programme_officer') &&
              detailItem('Programme officer name', project.programme_officer)}
            {canViewField(viewableFields, 'funding_window') &&
              detailItem('Funding window', project.funding_window)}
            {canViewField(viewableFields, 'decision') &&
              detailItem('Decision number', project.decision)}
            {canViewField(viewableFields, 'date_approved') &&
              dateDetailItem('Approval date', project.date_approved)}
          </div>
        </div>
      </div>
      {canViewField(viewableFields, 'excom_provision') &&
        detailItem(
          'Excom Provision',
          project.excom_provision,
          'whitespace-nowrap mr-6',
        )}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-y-4 border-0 pb-3 md:grid-cols-3 lg:grid-cols-4">
            {canViewField(viewableFields, 'ad_hoc_pcr') &&
              booleanDetailItem('Ad-hoc PCR', project.ad_hoc_pcr)}
            {canViewField(viewableFields, 'pcr_waived') &&
              booleanDetailItem('PCR waived', project.pcr_waived)}
            {canViewField(viewableFields, 'date_completion') &&
              dateDetailItem('Date of completion', project.date_completion)}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectApproval
